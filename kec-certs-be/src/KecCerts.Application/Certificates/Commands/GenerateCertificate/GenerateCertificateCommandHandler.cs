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
        var serialExists = await dbContext.Certificates
            .AnyAsync(c => c.SerialNumber == request.SerialNumber, cancellationToken);
        if (serialExists)
            throw new DuplicateException(nameof(Certificate), nameof(Certificate.SerialNumber), request.SerialNumber);

        var program = await dbContext.TrainingPrograms
            .Include(p => p.ActiveTemplate)
            .FirstOrDefaultAsync(p => p.Id == request.TrainingProgramId, cancellationToken)
            ?? throw new NotFoundException(nameof(TrainingProgram), request.TrainingProgramId);

        if (program.ActiveTemplate is null)
            throw new DomainException($"Training program '{program.Name}' has no active template assigned.");

        var placeholders = new Dictionary<string, string>
        {
            ["Emri"] = request.ParticipantFullName,
            ["Programi"] = program.Name,
            ["Data"] = request.IssueDate.ToString("dd.MM.yyyy"),
            ["NumriSerial"] = request.SerialNumber
        };

        var pdfBytes = await certificateGenerator.GenerateAsync(
            program.ActiveTemplate.TemplateFileKey, placeholders, cancellationToken);

        var fileName = $"{request.SerialNumber}_{request.ParticipantFullName}.pdf";
        var fileKey = await fileStorage.SaveFileAsync(
            pdfBytes, $"certificates/{program.Code}", fileName, cancellationToken);

        var certificate = Certificate.Create(
            request.SerialNumber,
            request.IssueDate,
            request.TrainingCode,
            request.TrainingName,
            request.ParticipantFullName,
            null, null, null, null, null, null, null, null, null, null,
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
