using KecCerts.Application.Common.Models;
using MediatR;

namespace KecCerts.Application.Certificates.Queries.GetCertificates;

public record GetCertificatesQuery(
    int PageNumber = 1,
    int PageSize = 20,
    string? SearchTerm = null,
    Guid? TrainingProgramId = null,
    DateOnly? FromDate = null,
    DateOnly? ToDate = null,
    int? FromSerial = null,
    int? ToSerial = null) : IRequest<PaginatedList<CertificateListDto>>;

public record CertificateListDto(
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
    DateTime CreatedAt);
