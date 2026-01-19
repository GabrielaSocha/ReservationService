namespace ReservationService.Dtos;

public class CreateReservationRequest
{
    public Guid TableId { get; set; }
    public DateTime StartAt { get; set; }
    public DateTime EndAt { get; set; }
    public string CustomerName { get; set; } = "";
    public string? IdempotencyKey { get; set; }
}
