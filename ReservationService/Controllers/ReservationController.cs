using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReservationService.Data;
using ReservationService.Dtos;
using ReservationService.Models;
using ReservationService.Services;

namespace ReservationService.Controllers;

[ApiController]
[Route("api/reservations")]
[Authorize]
public class ReservationController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ReservationManager _manager;

    public ReservationController(AppDbContext db, ReservationManager manager)
    {
        _db = db;
        _manager = manager;
    }

    [HttpGet]
    public async Task<ActionResult<List<ReservationEntity>>> Get()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var isAdmin = User.IsInRole("Admin");

        var query = _db.Reservations.AsNoTracking();

        if (!isAdmin)
            query = query.Where(r => r.UserId == userId);

        var list = await query.OrderByDescending(r => r.StartAt).ToListAsync();
        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult> Post(CreateReservationRequest req)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        TimeZoneInfo tz;
        try { tz = TimeZoneInfo.FindSystemTimeZoneById("Europe/Warsaw"); }
        catch { tz = TimeZoneInfo.Local; }

        req.StartAt = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(req.StartAt, DateTimeKind.Unspecified), tz);
        req.EndAt = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(req.EndAt, DateTimeKind.Unspecified), tz);



        var (ok, message, reservation) = await _manager.CreateAsync(req, userId);

        if (ok)
        {
            return Created($"/api/reservations/{reservation!.Id}", new
            {
                message,
                reservationId = reservation.Id
            });
        }

        if (message.Contains("reserved", StringComparison.OrdinalIgnoreCase) ||
            message.Contains("conflict", StringComparison.OrdinalIgnoreCase) ||
            message.Contains("Try again", StringComparison.OrdinalIgnoreCase))
        {
            return Conflict(new { message });
        }

        return BadRequest(new { message });
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> CancelOrDelete(string id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var isAdmin = User.IsInRole("Admin");

        var res = await _db.Reservations.FirstOrDefaultAsync(r => r.Id == Guid.Parse(id));
        if (res == null) return NotFound(new { message = "Reservation not found" });

        if (!isAdmin && res.UserId != userId)
            return Forbid();

        res.Status = "Cancelled";
        await _db.SaveChangesAsync();

        return Ok(new { message = "Cancelled" });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<ActionResult> Update(string id, CreateReservationRequest req)
    {
        var res = await _db.Reservations.FirstOrDefaultAsync(r => r.Id == Guid.Parse(id));
        if (res == null) return NotFound(new { message = "Reservation not found" });

        res.TableId = req.TableId;
        res.CustomerName = req.CustomerName;
        var tz = TimeZoneInfo.FindSystemTimeZoneById("Europe/Warsaw");

        res.StartAt = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(req.StartAt, DateTimeKind.Unspecified), tz);
        res.EndAt = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(req.EndAt, DateTimeKind.Unspecified), tz);


        await _db.SaveChangesAsync();
        return Ok(new { message = "Updated" });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}/hard")]
    public async Task<ActionResult> HardDelete(string id)
    {
        var res = await _db.Reservations.FirstOrDefaultAsync(r => r.Id == Guid.Parse(id));
        if (res == null) return NotFound(new { message = "Reservation not found" });

        _db.Reservations.Remove(res);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Deleted" });
    }
}
