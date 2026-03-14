using KecCerts.Application.Common.Interfaces;
using KecCerts.Application.Templates.Commands.ActivateTemplate;
using KecCerts.Application.Templates.Commands.CreateTemplate;
using KecCerts.Application.Templates.Queries.GetTemplates;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KecCerts.Api.Controllers;

[ApiController]
[Route("api/templates")]
[Authorize(Policy = "AdminOrAbove")]
public class TemplatesController(ISender mediator, IApplicationDbContext dbContext) : ControllerBase
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
    [RequestSizeLimit(20 * 1024 * 1024)]
    public async Task<IActionResult> Upload(
        [FromForm] IFormFile? file,
        [FromForm] string name,
        [FromForm] string? description,
        [FromForm] string? certificationType,
        [FromForm] string? location,
        [FromForm] Guid? trainingProgramId,
        [FromForm] List<string> placeholders,
        [FromForm] IFormFile? logo1,
        [FromForm] IFormFile? logo2,
        [FromForm] IFormFile? logo3,
        [FromForm] IFormFile? signature1,
        [FromForm] string? signature1Name,
        [FromForm] IFormFile? signature2,
        [FromForm] string? signature2Name,
        [FromForm] IFormFile? signature3,
        [FromForm] string? signature3Name,
        CancellationToken cancellationToken)
    {
        var stream = file?.OpenReadStream();
        var command = new CreateTemplateCommand(
            name, description, certificationType, location ?? "Prishtinë",
            stream, file?.FileName, trainingProgramId, placeholders ?? [],
            logo1?.OpenReadStream(), logo1?.FileName,
            logo2?.OpenReadStream(), logo2?.FileName,
            logo3?.OpenReadStream(), logo3?.FileName,
            signature1?.OpenReadStream(), signature1?.FileName, signature1Name,
            signature2?.OpenReadStream(), signature2?.FileName, signature2Name,
            signature3?.OpenReadStream(), signature3?.FileName, signature3Name);

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

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var template = await dbContext.CertificateTemplates
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
        if (template is null) return NotFound();

        dbContext.CertificateTemplates.Remove(template);
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
