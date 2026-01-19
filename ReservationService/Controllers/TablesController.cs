using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReservationService.Data;
using ReservationService.Dtos;
using ReservationService.Models;

namespace ReservationService.Controllers;

[ApiController]
[Route("api/tables")]
public class TablesController : ControllerBase
{
    private readonly AppDbContext _db;

    public TablesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<TableEntity>>> Get()
    {
        var tables = await _db.Tables
            .AsNoTracking()
            .OrderBy(t => t.Name)
            .ToListAsync();

        return Ok(tables);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<TableEntity>> Post(CreateTableRequest req)
    {
        var entity = new TableEntity
        {
            Id = Guid.NewGuid(),
            Name = req.Name.Trim(),
            Seats = req.Seats
        };

        _db.Tables.Add(entity);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = entity.Id }, entity);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<ActionResult> Put(string id, CreateTableRequest req)
    {
        var table = await _db.Tables.FirstOrDefaultAsync(t => t.Id == Guid.Parse(id));
        if (table == null) return NotFound(new { message = "Table not found" });

        table.Name = req.Name.Trim();
        table.Seats = req.Seats;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Updated" });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        var table = await _db.Tables.FirstOrDefaultAsync(t => t.Id == Guid.Parse(id));
        if (table == null) return NotFound(new { message = "Table not found" });

        _db.Tables.Remove(table);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Deleted" });
    }
}
