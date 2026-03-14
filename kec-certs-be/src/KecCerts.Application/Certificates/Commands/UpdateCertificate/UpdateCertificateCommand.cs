using MediatR;

namespace KecCerts.Application.Certificates.Commands.UpdateCertificate;

public record UpdateCertificateCommand(
    Guid Id,
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
    string? TrainingDates) : IRequest<UpdateCertificateResult>;

public record UpdateCertificateResult(Guid Id, string SerialNumber);
