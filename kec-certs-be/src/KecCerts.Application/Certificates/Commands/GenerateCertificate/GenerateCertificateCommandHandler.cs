using KecCerts.Application.Common.Interfaces;
using KecCerts.Domain.Entities;
using KecCerts.Domain.Enums;
using KecCerts.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KecCerts.Application.Certificates.Commands.GenerateCertificate;

public class GenerateCertificateCommandHandler(
    IApplicationDbContext dbContext,
    ICurrentUserService currentUser,
    ICertificateGenerator certificateGenerator,
    IFileStorageService fileStorage)
    : IRequestHandler<GenerateCertificateCommand, GenerateCertificateResult>
{
    public async Task<GenerateCertificateResult> Handle(
        GenerateCertificateCommand request, CancellationToken cancellationToken)
    {
        // Validate serial number uniqueness
        var serialExists = await dbContext.Certificates
            .AnyAsync(c => c.SerialNumber == request.SerialNumber, cancellationToken);
        if (serialExists)
            throw new DuplicateException(nameof(Certificate), nameof(Certificate.SerialNumber), request.SerialNumber);

        // Load program with active template
        var program = await dbContext.TrainingPrograms
            .Include(p => p.ActiveTemplate)
            .FirstOrDefaultAsync(p => p.Id == request.TrainingProgramId, cancellationToken)
            ?? throw new NotFoundException(nameof(TrainingProgram), request.TrainingProgramId);

        if (program.ActiveTemplate is null)
            throw new DomainException($"Training program '{program.Name}' has no active template assigned.");

        // Build placeholder values
        var placeholders = new Dictionary<string, string>
        {
            ["Emri"] = request.FirstName,
            ["Mbiemri"] = request.LastName,
            ["Programi"] = program.Name,
            ["Data"] = request.IssueDate.ToString("dd.MM.yyyy"),
            ["NumriSerial"] = request.SerialNumber,
            ["Nota"] = request.Grade ?? string.Empty
        };

        // Generate PDF
        var pdfBytes = await certificateGenerator.GenerateAsync(
            program.ActiveTemplate.TemplateFileKey, placeholders, cancellationToken);

        // Save file
        var fileName = $"{request.SerialNumber}_{request.LastName}_{request.FirstName}.pdf";
        var fileKey = await fileStorage.SaveFileAsync(
            pdfBytes, $"certificates/{program.Code}", fileName, cancellationToken);

        // Create domain entity
        var certificate = Certificate.Create(
            request.SerialNumber,
            request.FirstName,
            request.LastName,
            request.PersonalNumber,
            request.IssueDate,
            request.Grade,
            program.Id,
            program.ActiveTemplate.Id,
            GenerationMethod.Manual,
            currentUser.UserId);

        certificate.FileKey = fileKey;

        dbContext.Certificates.Add(certificate);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new GenerateCertificateResult(certificate.Id, certificate.SerialNumber, fileKey);
    }
}
