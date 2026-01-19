using Microsoft.EntityFrameworkCore;
using ReservationService.Data;
using ReservationService.Dtos;
using ReservationService.Models;

namespace ReservationService.Services;

public class ReservationManager
{
    private readonly AppDbContext _db;
    private readonly RedisLockService _lockService;

    public ReservationManager(AppDbContext db, RedisLockService lockService)
    {
        _db = db;
        _lockService = lockService;
    }

    public Task<(bool ok, string message, ReservationEntity? reservation)> CreateAsync(
        CreateReservationRequest req,
        string userId)
    {
        return CreateAsync(
            req.TableId,
            req.StartAt,
            req.EndAt,
            req.CustomerName,
            userId,
            req.IdempotencyKey
        );
    }

    public async Task<(bool ok, string message, ReservationEntity? reservation)> CreateAsync(
        Guid tableId,
        DateTime startAt,
        DateTime endAt,
        string customerName,
        string userId,
        string? idempotencyKey)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return (false, "UserId is required", null);

        if (string.IsNullOrWhiteSpace(customerName))
            return (false, "CustomerName is required", null);

        if (endAt <= startAt)
            return (false, "EndAt must be after StartAt", null);

        startAt = startAt.ToUniversalTime();
        endAt = endAt.ToUniversalTime();

        var lockKey = $"lock:reservation:table:{tableId}:{startAt:yyyyMMddHHmm}-{endAt:yyyyMMddHHmm}";
        var token = await _lockService.AcquireLockAsync(lockKey, TimeSpan.FromSeconds(10));

        if (token is null)
            return (false, "This slot is being reserved right now. Try again.", null);

        try
        {
            if (!string.IsNullOrWhiteSpace(idempotencyKey))
            {
                var existing = await _db.Reservations
                    .AsNoTracking()
                    .FirstOrDefaultAsync(r => r.IdempotencyKey == idempotencyKey);

                if (existing != null)
                    return (true, "Already created (idempotent)", existing);
            }

            var tableExists = await _db.Tables.AnyAsync(t => t.Id == tableId);
            if (!tableExists)
                return (false, "Table not found", null);

            var overlaps = await _db.Reservations.AnyAsync(r =>
                r.TableId == tableId &&
                r.Status != "Cancelled" &&
                startAt < r.EndAt &&
                endAt > r.StartAt);

            if (overlaps)
                return (false, "Table already reserved for that time", null);

            var reservation = new ReservationEntity
            {
                TableId = tableId,

                StartAt = startAt,
                EndAt = endAt,
                CustomerName = customerName.Trim(),
                Status = "Confirmed",
                IdempotencyKey = string.IsNullOrWhiteSpace(idempotencyKey) ? null : idempotencyKey,

                UserId = userId
            };

            _db.Reservations.Add(reservation);

            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return (false, "Reservation conflict (db constraint)", null);
            }

            return (true, "Created", reservation);
        }
        finally
        {
            await _lockService.ReleaseLockAsync(lockKey, token);
        }
    }
}
