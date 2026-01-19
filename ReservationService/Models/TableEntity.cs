namespace ReservationService.Models;

public class TableEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int Seats { get; set; }
    public string Name { get; set; } = "";
}
