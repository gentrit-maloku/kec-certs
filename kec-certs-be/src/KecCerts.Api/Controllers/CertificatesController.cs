using KecCerts.Application.Certificates.Commands.ImportCertificates;
using KecCerts.Application.Certificates.Commands.UpdateCertificate;
using KecCerts.Application.Certificates.Queries.GetCertificate;
using KecCerts.Application.Certificates.Queries.GetCertificates;
using KecCerts.Application.Common.Interfaces;
using KecCerts.Application.Common.Models;
using KecCerts.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KecCerts.Api.Controllers;

[ApiController]
[Route("api/certificates")]
[Authorize]
public sealed class CertificatesController(
    ISender sender,
    IFileStorageService fileStorage,
    IApplicationDbContext dbContext,
    ICertificateGenerator certificateGenerator) : ControllerBase
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
        [FromQuery] int? fromSerial = null,
        [FromQuery] int? toSerial = null,
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(
            new GetCertificatesQuery(pageNumber, pageSize, search, programId, from, to, fromSerial, toSerial),
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

    [HttpPost("import")]
    [Authorize(Policy = "UserOrAbove")]
    [ProducesResponseType<ImportCertificatesResult>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [RequestSizeLimit(20 * 1024 * 1024)]
    public async Task<IActionResult> Import(
        [FromForm] IFormFile file,
        [FromForm] bool continueOnErrors = true,
        CancellationToken cancellationToken = default)
    {
        if (file.Length == 0)
            return BadRequest(new { error = "File is required." });

        await using var stream = file.OpenReadStream();
        var result = await sender.Send(
            new ImportCertificatesCommand(stream, file.FileName, continueOnErrors),
            cancellationToken);

        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "UserOrAbove")]
    [ProducesResponseType<UpdateCertificateResult>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateCertificateRequest request,
        CancellationToken cancellationToken)
    {
        var command = new UpdateCertificateCommand(
            id,
            request.IssueDate,
            request.TrainingCode,
            request.TrainingName,
            request.ParticipantFullName,
            request.PersonalNumber,
            request.TrainingGroup,
            request.Gender,
            request.Position,
            request.Subject,
            request.InstitutionName,
            request.InstitutionLocation,
            request.Municipality,
            request.InstitutionType,
            request.TrainingDates);

        var result = await sender.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:guid}/generate-pdf")]
    [Authorize(Policy = "UserOrAbove")]
    public async Task<IActionResult> GeneratePdf(Guid id, CancellationToken cancellationToken)
    {
        var cert = await dbContext.Certificates
            .Include(c => c.TrainingProgram)
            .ThenInclude(p => p!.ActiveTemplate)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (cert is null) return NotFound();

        var template = cert.TrainingProgram?.ActiveTemplate;

        // Also try to load template directly if program has activeTemplateId
        if (template == null && cert.TemplateId != null)
        {
            template = await dbContext.CertificateTemplates
                .FirstOrDefaultAsync(t => t.Id == cert.TemplateId, cancellationToken);
        }
        if (template == null && cert.TrainingProgram?.ActiveTemplateId != null)
        {
            template = await dbContext.CertificateTemplates
                .FirstOrDefaultAsync(t => t.Id == cert.TrainingProgram.ActiveTemplateId, cancellationToken);
        }

        var genData = new CertificateGenerationData
        {
            SerialNumber = cert.SerialNumber,
            IssueDate = cert.IssueDate.ToString("dd.MM.yyyy"),
            TrainingCode = cert.TrainingCode,
            TrainingName = cert.TrainingName,
            ParticipantFullName = cert.ParticipantFullName,
            CertificationType = template?.CertificationType,
            Location = template?.Location ?? "Prishtinë",
            Logo1FileKey = template?.Logo1FileKey,
            Logo2FileKey = template?.Logo2FileKey,
            Logo3FileKey = template?.Logo3FileKey,
            Signature1FileKey = template?.Signature1FileKey,
            Signature1Name = template?.Signature1Name,
            Signature2FileKey = template?.Signature2FileKey,
            Signature2Name = template?.Signature2Name,
            Signature3FileKey = template?.Signature3FileKey,
            Signature3Name = template?.Signature3Name,
        };

        var pdfBytes = await certificateGenerator.GenerateFromTemplateAsync(genData, cancellationToken);

        // Save PDF and update certificate
        var fileName = $"{cert.SerialNumber}_{cert.ParticipantFullName.Replace(" ", "_")}.pdf";
        var fileKey = await fileStorage.SaveFileAsync(
            pdfBytes, $"certificates/{cert.TrainingCode}", fileName, cancellationToken);

        cert.FileKey = fileKey;
        cert.TemplateId = template?.Id;
        await dbContext.SaveChangesAsync(cancellationToken);

        return File(pdfBytes, "application/pdf", $"certificate_{cert.SerialNumber}.pdf");
    }

    [HttpGet("{id:guid}/download")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Download(Guid id, CancellationToken cancellationToken)
    {
        var certificate = await sender.Send(new GetCertificateQuery(id), cancellationToken);
        if (certificate is null) return NotFound();
        if (string.IsNullOrEmpty(certificate.FileKey)) return NotFound(new { error = "No file available." });

        var fileBytes = await fileStorage.GetFileAsync(certificate.FileKey, cancellationToken);
        var fileName = $"certificate_{certificate.SerialNumber}.pdf";

        return File(fileBytes, "application/pdf", fileName);
    }
}

public record UpdateCertificateRequest(
    DateOnly IssueDate,
    string TrainingCode,
    string TrainingName,
    string ParticipantFullName,
    string? PersonalNumber,
    string? TrainingGroup,
    string? Gender,
    string? Position,
    string? Subject,
    string? InstitutionName,
    string? InstitutionLocation,
    string? Municipality,
    string? InstitutionType,
    string? TrainingDates);
