using KecCerts.Application.Common.Interfaces;
using KecCerts.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KecCerts.Api.Controllers;

[ApiController]
[Route("api/documents")]
[Authorize]
public sealed class DocumentsController(
    IApplicationDbContext dbContext,
    IFileStorageService fileStorage,
    ICurrentUserService currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? category = null,
        [FromQuery] string? search = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Documents.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(d => d.Category == category);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(d =>
                d.Name.ToLower().Contains(term) ||
                d.FileName.ToLower().Contains(term) ||
                (d.Description != null && d.Description.ToLower().Contains(term)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new DocumentDto(
                d.Id, d.Name, d.FileName, d.ContentType, d.FileSize,
                d.Category, d.Description, d.CreatedAt))
            .ToListAsync(cancellationToken);

        return Ok(new { items, totalCount, pageNumber, pageSize });
    }

    [HttpPost("upload")]
    [Authorize(Policy = "UserOrAbove")]
    [RequestSizeLimit(50 * 1024 * 1024)]
    public async Task<IActionResult> Upload(
        [FromForm] IFormFile file,
        [FromForm] string name,
        [FromForm] string category,
        [FromForm] string? description = null,
        CancellationToken cancellationToken = default)
    {
        if (file.Length == 0)
            return BadRequest(new { error = "File is required." });

        var validCategories = new[] { "certificate", "decision", "other" };
        if (!validCategories.Contains(category.ToLower()))
            return BadRequest(new { error = "Category must be: certificate, decision, or other." });

        var fileBytes = new byte[file.Length];
        await using var stream = file.OpenReadStream();
        await stream.ReadExactlyAsync(fileBytes, cancellationToken);

        var fileKey = await fileStorage.SaveFileAsync(
            fileBytes, $"documents/{category}", file.FileName, cancellationToken);

        var document = new Document
        {
            Id = Guid.NewGuid(),
            Name = name,
            FileKey = fileKey,
            FileName = file.FileName,
            ContentType = file.ContentType,
            FileSize = file.Length,
            Category = category.ToLower(),
            Description = description,
            CreatedByUserId = currentUser.UserId
        };

        dbContext.Documents.Add(document);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new { id = document.Id, name = document.Name, fileKey });
    }

    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> Download(Guid id, CancellationToken cancellationToken)
    {
        var doc = await dbContext.Documents
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

        if (doc is null) return NotFound();

        var fileBytes = await fileStorage.GetFileAsync(doc.FileKey, cancellationToken);
        Response.Headers.Append("Content-Disposition", $"inline; filename=\"{doc.FileName}\"");
        return File(fileBytes, doc.ContentType);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOrAbove")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var doc = await dbContext.Documents.FirstOrDefaultAsync(d => d.Id == id, cancellationToken);
        if (doc is null) return NotFound();

        await fileStorage.DeleteFileAsync(doc.FileKey, cancellationToken);
        dbContext.Documents.Remove(doc);
        await dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}

public record DocumentDto(
    Guid Id, string Name, string FileName, string ContentType,
    long FileSize, string Category, string? Description, DateTime CreatedAt);
