using MediatR;

namespace KecCerts.Application.Certificates.Commands.GenerateCertificate;

public record GenerateCertificateCommand(
    string SerialNumber,
    string FirstName,
    string LastName,
    string? PersonalNumber,
    DateOnly IssueDate,
    string? Grade,
    Guid TrainingProgramId) : IRequest<GenerateCertificateResult>;

public record GenerateCertificateResult(Guid CertificateId, string SerialNumber, string FileKey);
