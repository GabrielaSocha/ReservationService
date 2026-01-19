using Microsoft.AspNetCore.Identity;

namespace ReservationService.Auth;

public static class IdentitySeeder
{
    public const string AdminRole = "Admin";
    public const string UserRole = "User";

    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();

        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        // Role
        if (!await roleManager.RoleExistsAsync(AdminRole))
            await roleManager.CreateAsync(new IdentityRole(AdminRole));

        if (!await roleManager.RoleExistsAsync(UserRole))
            await roleManager.CreateAsync(new IdentityRole(UserRole));

        // Admin user
        var adminEmail = "admin@local";
        var adminPassword = "Admin123!";

        var admin = await userManager.FindByEmailAsync(adminEmail);
        if (admin == null)
        {
            admin = new AppUser { UserName = adminEmail, Email = adminEmail, EmailConfirmed = true };
            var created = await userManager.CreateAsync(admin, adminPassword);
            if (!created.Succeeded)
            {
                var msg = string.Join("; ", created.Errors.Select(e => e.Description));
                throw new Exception($"Cannot create admin user: {msg}");
            }
        }

        if (!await userManager.IsInRoleAsync(admin, AdminRole))
            await userManager.AddToRoleAsync(admin, AdminRole);
    }
}
