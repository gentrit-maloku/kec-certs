using KecCerts.Application.Common.Models;
using KecCerts.Application.Programs.Commands.CreateProgram;
using KecCerts.Application.Programs.Commands.UpdateProgram;
using KecCerts.Application.Programs.Queries.GetPrograms;
using KecCerts.Application.Templates.Commands.ActivateTemplate;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KecCerts.Api.Controllers;

[ApiController]
[Route("api/programs")]
[Authorize]
public sealed class TrainingProgramsController(ISender sender) : ControllerBase
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
            new UpdateProgramCommand(id, request.Name, request.Description, request.IsActive),
            cancellationToken);
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

public record UpdateProgramRequest(string Name, string? Description, bool IsActive);
