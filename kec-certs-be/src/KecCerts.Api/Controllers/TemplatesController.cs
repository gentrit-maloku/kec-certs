using KecCerts.Application.Templates.Commands.ActivateTemplate;
using KecCerts.Application.Templates.Commands.CreateTemplate;
using KecCerts.Application.Templates.Queries.GetTemplates;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KecCerts.Api.Controllers;

[ApiController]
[Route("api/templates")]
[Authorize(Policy = "SuperAdmin")]
public class TemplatesController(ISender mediator) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = "ViewerOrAbove")]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] Guid? programId = null,
        CancellationToken cancellationToken = default)
    {
        var query = new GetTemplatesQuery(pageNumber, pageSize, programId);
        var result = await mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> Upload(
        [FromForm] IFormFile file,
        [FromForm] string name,
        [FromForm] string? description,
        [FromForm] Guid? trainingProgramId,
        [FromForm] List<string> placeholders,
        CancellationToken cancellationToken)
    {
        await using var stream = file.OpenReadStream();
        var command = new CreateTemplateCommand(
            name, description, stream, file.FileName, trainingProgramId, placeholders);

        var id = await mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetAll), new { id }, new { id });
    }

    [HttpPost("{templateId:guid}/activate/{programId:guid}")]
    public async Task<IActionResult> Activate(
        Guid templateId, Guid programId, CancellationToken cancellationToken)
    {
        var command = new ActivateTemplateCommand(templateId, programId);
        await mediator.Send(command, cancellationToken);
        return NoContent();
    }
}
