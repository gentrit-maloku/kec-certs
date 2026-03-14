using MediatR;

namespace KecCerts.Application.Certificates.Commands.GenerateCertificate;

// Kept for backwards compatibility - manual generation is being phased out
public record GenerateCertificateCommand(
    string SerialNumber,
    string ParticipantFullName,
    string TrainingCode,
    string TrainingName,
    DateOnly IssueDate,
    Guid TrainingProgramId) : IRequest<GenerateCertificateResult>;

public record GenerateCertificateResult(Guid CertificateId, string SerialNumber, string? FileKey);
