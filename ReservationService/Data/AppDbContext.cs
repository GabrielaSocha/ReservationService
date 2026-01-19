using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ReservationService.Auth;
using ReservationService.Models;

namespace ReservationService.Data;

public class AppDbContext : IdentityDbContext<AppUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<TableEntity> Tables => Set<TableEntity>();
    public DbSet<ReservationEntity> Reservations => Set<ReservationEntity>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<TableEntity>()
            .HasIndex(t => t.Name)
            .IsUnique();

        builder.Entity<ReservationEntity>()
            .HasIndex(r => new { r.TableId, r.StartAt, r.EndAt });

        builder.Entity<ReservationEntity>()
            .HasIndex(r => r.IdempotencyKey)
            .IsUnique(false);
    }
}
