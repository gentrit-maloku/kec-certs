using KecCerts.Application.Certificates.Commands.GenerateBulkCertificates;
using KecCerts.Application.Certificates.Commands.GenerateCertificate;
using KecCerts.Application.Certificates.Queries.GetCertificate;
using KecCerts.Application.Certificates.Queries.GetCertificates;
using KecCerts.Application.Common.Interfaces;
using KecCerts.Application.Common.Models;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KecCerts.Api.Controllers;

[ApiController]
[Route("api/certificates")]
[Authorize]
public sealed class CertificatesController(ISender sender, IFileStorageService fileStorage) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PaginatedList<CertificateListDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] Guid? programId = null,
        [FromQuery] DateOnly? from = null,
        [FromQuery] DateOnly? to = null,
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(
            new GetCertificatesQuery(pageNumber, pageSize, search, programId, from, to),
            cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType<CertificateDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetCertificateQuery(id), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("generate")]
    [Authorize(Policy = "UserOrAbove")]
    [ProducesResponseType<GenerateCertificateResult>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Generate(
        [FromBody] GenerateCertificateCommand command,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.CertificateId }, result);
    }

    [HttpPost("bulk")]
    [Authorize(Policy = "UserOrAbove")]
    [ProducesResponseType<BulkGenerationResult>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [RequestSizeLimit(20 * 1024 * 1024)]
    public async Task<IActionResult> BulkGenerate(
        [FromForm] IFormFile file,
        [FromForm] Guid trainingProgramId,
        CancellationToken cancellationToken)
    {
        if (file.Length == 0)
            return BadRequest(new { error = "File is required." });

        await using var stream = file.OpenReadStream();
        var result = await sender.Send(
            new GenerateBulkCertificatesCommand(stream, file.FileName, trainingProgramId),
            cancellationToken);

        return Ok(result);
    }

    [HttpGet("{id:guid}/download")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Download(Guid id, CancellationToken cancellationToken)
    {
        var certificate = await sender.Send(new GetCertificateQuery(id), cancellationToken);
        if (certificate is null) return NotFound();

        var fileBytes = await fileStorage.GetFileAsync(certificate.FileKey, cancellationToken);
        var fileName = $"certificate_{certificate.SerialNumber}.pdf";

        return File(fileBytes, "application/pdf", fileName);
    }
}
