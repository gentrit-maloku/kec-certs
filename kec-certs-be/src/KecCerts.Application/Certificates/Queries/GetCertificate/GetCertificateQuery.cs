using MediatR;

namespace KecCerts.Application.Certificates.Queries.GetCertificate;

public record GetCertificateQuery(Guid Id) : IRequest<CertificateDetailDto?>;

public record CertificateDetailDto(
    Guid Id,
    string SerialNumber,
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
    string? TrainingDates,
    string? FileKey,
    string GenerationMethod,
    Guid? TrainingProgramId,
    string? TrainingProgramName,
    string? TrainingProgramCode,
    Guid? BatchId,
    DateTime CreatedAt);
