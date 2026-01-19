namespace ReservationService.Dtos;

public class RaceTestRequest
{
    public Guid TableId { get; set; }
    public DateTime StartAt { get; set; }
    public DateTime EndAt { get; set; }

    public int Attempts { get; set; } = 50;
    public string CustomerNamePrefix { get; set; } = "RaceUser";
}
