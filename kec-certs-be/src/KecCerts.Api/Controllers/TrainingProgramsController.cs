using KecCerts.Application.Common.Interfaces;
using KecCerts.Application.Common.Models;
using KecCerts.Application.Programs.Commands.CreateProgram;
using KecCerts.Application.Programs.Commands.ImportPrograms;
using KecCerts.Application.Programs.Commands.UpdateProgram;
using KecCerts.Application.Programs.Queries.GetPrograms;
using KecCerts.Application.Templates.Commands.ActivateTemplate;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KecCerts.Api.Controllers;

[ApiController]
[Route("api/programs")]
[Authorize]
public sealed class TrainingProgramsController(ISender sender, IApplicationDbContext dbContext) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PaginatedList<ProgramDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(
            new GetProgramsQuery(pageNumber, pageSize, search, isActive),
            cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = "AdminOrAbove")]
    [ProducesResponseType<Guid>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(
        [FromBody] CreateProgramCommand command,
        CancellationToken cancellationToken)
    {
        var id = await sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetAll), new { id }, new { id });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "AdminOrAbove")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateProgramRequest request,
        CancellationToken cancellationToken)
    {
        await sender.Send(
            new UpdateProgramCommand(id, request.Name, request.Description, request.IsActive,
                request.NumberOfHours, request.RegistrationDate, request.Status,
                request.AccreditationFrom, request.AccreditationTo),
            cancellationToken);
        return NoContent();
    }

    [HttpPost("import")]
    [Authorize(Policy = "AdminOrAbove")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> Import(
        IFormFile file,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "Skedari është i detyrueshëm." });

        await using var stream = file.OpenReadStream();
        var result = await sender.Send(new ImportProgramsCommand(stream), cancellationToken);

        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOrAbove")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var program = await dbContext.TrainingPrograms
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (program is null) return NotFound();

        dbContext.TrainingPrograms.Remove(program);
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("{programId:guid}/templates/{templateId:guid}/activate")]
    [Authorize(Policy = "AdminOrAbove")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ActivateTemplate(
        Guid programId,
        Guid templateId,
        CancellationToken cancellationToken)
    {
        await sender.Send(new ActivateTemplateCommand(templateId, programId), cancellationToken);
        return NoContent();
    }
}

public record UpdateProgramRequest(
    string Name,
    string? Description,
    bool IsActive,
    int? NumberOfHours,
    DateOnly? RegistrationDate,
    string? Status,
    DateOnly? AccreditationFrom,
    DateOnly? AccreditationTo);
