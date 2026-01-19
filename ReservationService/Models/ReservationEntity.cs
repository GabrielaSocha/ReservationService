namespace ReservationService.Models;

public class ReservationEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid TableId { get; set; }
    public TableEntity? Table { get; set; }

    public DateTime StartAt { get; set; }
    public DateTime EndAt { get; set; }

    public string CustomerName { get; set; } = "";
    public string Status { get; set; } = "Confirmed";

    public string? IdempotencyKey { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string UserId { get; set; } = "";

}
