using KecCerts.Application.Common.Models;
using MediatR;

namespace KecCerts.Application.Certificates.Queries.GetCertificates;

public record GetCertificatesQuery(
    int PageNumber = 1,
    int PageSize = 20,
    string? SearchTerm = null,
    Guid? TrainingProgramId = null,
    DateOnly? FromDate = null,
    DateOnly? ToDate = null) : IRequest<PaginatedList<CertificateListDto>>;

public record CertificateListDto(
    Guid Id,
    string SerialNumber,
    string ParticipantFirstName,
    string ParticipantLastName,
    string? ParticipantPersonalNumber,
    DateOnly IssueDate,
    string? Grade,
    string TrainingProgramName,
    string TrainingProgramCode,
    string GenerationMethod,
    DateTime CreatedAt);
