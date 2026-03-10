using MediatR;

namespace KecCerts.Application.Certificates.Queries.GetCertificate;

public record GetCertificateQuery(Guid Id) : IRequest<CertificateDetailDto?>;

public record CertificateDetailDto(
    Guid Id,
    string SerialNumber,
    string ParticipantFirstName,
    string ParticipantLastName,
    string? ParticipantPersonalNumber,
    DateOnly IssueDate,
    string? Grade,
    string FileKey,
    string GenerationMethod,
    Guid TrainingProgramId,
    string TrainingProgramName,
    string TrainingProgramCode,
    Guid? BatchId,
    DateTime CreatedAt);
