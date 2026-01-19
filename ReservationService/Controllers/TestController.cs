using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReservationService.Dtos;
using ReservationService.Services;

namespace ReservationService.Controllers;

[ApiController]
[Route("api/tests")]
public class TestsController : ControllerBase
{
    private readonly IServiceScopeFactory _scopeFactory;

    public TestsController(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("race")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Race([FromBody] RaceTestRequest req)
    {
        if (req.TableId == Guid.Empty)
            return BadRequest(new { message = "TableId is required" });

        if (req.EndAt <= req.StartAt)
            return BadRequest(new { message = "EndAt must be after StartAt" });

        var attempts = req.Attempts <= 0 ? 50 : Math.Min(req.Attempts, 500);

        var adminUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var tasks = Enumerable.Range(1, attempts).Select(async i =>
        {
            using var scope = _scopeFactory.CreateScope();
            var manager = scope.ServiceProvider.GetRequiredService<ReservationManager>();

            var idempotencyKey = $"race-{req.TableId}-{req.StartAt:yyyyMMddHHmm}-{req.EndAt:yyyyMMddHHmm}-{Guid.NewGuid():N}";
            var customer = $"{req.CustomerNamePrefix}-{i:D2}";

            var (ok, message, reservation) = await manager.CreateAsync(
                req.TableId, req.StartAt, req.EndAt, customer, adminUserId, idempotencyKey);

            return new
            {
                ok,
                message,
                reservationId = reservation?.Id
            };
        }).ToArray();

        var results = await Task.WhenAll(tasks);

        var success = results.Count(r => r.ok);
        var conflicts = results.Count(r =>
            !r.ok && (
                r.message.Contains("reserved", StringComparison.OrdinalIgnoreCase) ||
                r.message.Contains("conflict", StringComparison.OrdinalIgnoreCase) ||
                r.message.Contains("Try again", StringComparison.OrdinalIgnoreCase)
            )
        );

        var otherFails = results.Length - success - conflicts;

        return Ok(new
        {
            attempts = results.Length,
            success,
            conflicts,
            otherFails,
            sample = results.Take(10)
        });
    }
}
