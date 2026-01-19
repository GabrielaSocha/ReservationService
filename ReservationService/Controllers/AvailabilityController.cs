using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReservationService.Data;
using ReservationService.Models;
using System.Globalization;

namespace ReservationService.Controllers;

[ApiController]
[Route("api/availability")]
public class AvailabilityController : ControllerBase
{
    private readonly AppDbContext _db;

    public AvailabilityController(AppDbContext db)
    {
        _db = db;
    }

    [AllowAnonymous]
    [HttpGet("by-table")]
    public async Task<ActionResult<AvailabilityByTableResponse>> GetByTable(
        [FromQuery] string date,
        [FromQuery] int partySize,
        [FromQuery] int durationMinutes)
    {
        if (!DateOnly.TryParse(date, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dateOnly))
            return BadRequest("Niepoprawny parametr: date (format: YYYY-MM-DD).");

        if (partySize <= 0)
            return BadRequest("Niepoprawny parametr: partySize (> 0).");

        if (durationMinutes <= 0)
            return BadRequest("Niepoprawny parametr: durationMinutes (> 0).");

        TimeZoneInfo tz;
        try { tz = TimeZoneInfo.FindSystemTimeZoneById("Europe/Warsaw"); }
        catch { tz = TimeZoneInfo.Local; }

        var openLocal = new TimeOnly(12, 0);
        var closeLocal = new TimeOnly(22, 0);

        var dayStartLocal = dateOnly.ToDateTime(openLocal);
        var dayEndLocal = dateOnly.ToDateTime(closeLocal);

        var dayStartUtc = ToUtc(dayStartLocal, tz);
        var dayEndUtc = ToUtc(dayEndLocal, tz);

        var rangeStartUtc = dayStartUtc.AddMinutes(-durationMinutes);
        var rangeEndUtc = dayEndUtc.AddMinutes(durationMinutes);

        var tables = await _db.Tables
            .AsNoTracking()
            .Where(t => t.Seats >= partySize)
            .OrderBy(t => t.Seats)
            .ThenBy(t => t.Name)
            .ToListAsync();

        var tableIds = tables.Select(t => t.Id).ToList();

        var reservationsRaw = await _db.Reservations
            .AsNoTracking()
            .Where(r => tableIds.Contains(r.TableId))
            .Where(r => r.StartAt < rangeEndUtc && r.EndAt > rangeStartUtc)
            .ToListAsync();


        var reservations = reservationsRaw
            .Where(r => !IsCancelled(r.Status))
            .Select(r => new ReservationWindow
            {
                TableId = r.TableId,
                StartUtc = EnsureUtcInMemory(r.StartAt),
                EndUtc = EnsureUtcInMemory(r.EndAt)
            })
            .ToList();

        var resByTable = reservations
            .GroupBy(r => r.TableId)
            .ToDictionary(g => g.Key, g => g.ToList()); 

        const int stepMinutes = 15;
        var responseTables = new List<TableAvailabilityDto>();

        foreach (var table in tables)
        {
            var tableReservations = resByTable.TryGetValue(table.Id, out var list)
                ? list
                : new List<ReservationWindow>();

            var slots = new List<SlotDto>();

            for (var slotStartLocal = dayStartLocal;
                 slotStartLocal.AddMinutes(durationMinutes) <= dayEndLocal;
                 slotStartLocal = slotStartLocal.AddMinutes(stepMinutes))
            {
                var slotEndLocal = slotStartLocal.AddMinutes(durationMinutes);

                var slotStartUtc = ToUtc(slotStartLocal, tz);
                var slotEndUtc = ToUtc(slotEndLocal, tz);

                var conflict = tableReservations.Any(r =>
                    r.StartUtc < slotEndUtc &&
                    slotStartUtc < r.EndUtc);

                if (!conflict)
                {
                    slots.Add(new SlotDto
                    {
                        Start = slotStartLocal,
                        End = slotEndLocal
                    });
                }
            }

            if (slots.Count > 0)
            {
                responseTables.Add(new TableAvailabilityDto
                {
                    Id = table.Id,
                    Name = table.Name,
                    Seats = table.Seats,
                    Slots = slots
                });
            }
        }

        return Ok(new AvailabilityByTableResponse
        {
            Date = dateOnly.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            PartySize = partySize,
            DurationMinutes = durationMinutes,
            Open = openLocal.ToString("HH:mm", CultureInfo.InvariantCulture),
            Close = closeLocal.ToString("HH:mm", CultureInfo.InvariantCulture),
            Tables = responseTables
        });
    }


    private static DateTime ToUtc(DateTime localUnspecified, TimeZoneInfo tz)
        => TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(localUnspecified, DateTimeKind.Unspecified), tz);

    private static DateTime EnsureUtcInMemory(DateTime dt)
    {
        if (dt.Kind == DateTimeKind.Utc) return dt;
        if (dt.Kind == DateTimeKind.Local) return dt.ToUniversalTime();
        return DateTime.SpecifyKind(dt, DateTimeKind.Utc);
    }

    private static bool IsCancelled(object? status)
    {
        if (status is null) return false;
        var s = status.ToString() ?? "";
        return s.Equals("Cancelled", StringComparison.OrdinalIgnoreCase)
            || s.Equals("Canceled", StringComparison.OrdinalIgnoreCase);
    }

    private sealed class ReservationWindow
    {
        public Guid TableId { get; set; }
        public DateTime StartUtc { get; set; }
        public DateTime EndUtc { get; set; }
    }


    public sealed class AvailabilityByTableResponse
    {
        public string Date { get; set; } = default!;
        public int PartySize { get; set; }
        public int DurationMinutes { get; set; }
        public string Open { get; set; } = default!;
        public string Close { get; set; } = default!;
        public List<TableAvailabilityDto> Tables { get; set; } = new();
    }

    public sealed class TableAvailabilityDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = default!;
        public int Seats { get; set; }
        public List<SlotDto> Slots { get; set; } = new();
    }

    public sealed class SlotDto
    {
        public DateTime Start { get; set; } 
        public DateTime End { get; set; }   
    }
}
