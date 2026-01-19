namespace ReservationService.Dtos;

public class CreateTableRequest
{
    public string Name { get; set; } = "";
    public int Seats { get; set; }
}
