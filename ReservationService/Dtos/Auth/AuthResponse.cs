namespace ReservationService.Dtos.Auth;

public class AuthResponse
{
    public string Token { get; set; } = "";
    public string Email { get; set; } = "";
    public string[] Roles { get; set; } = Array.Empty<string>();
}
