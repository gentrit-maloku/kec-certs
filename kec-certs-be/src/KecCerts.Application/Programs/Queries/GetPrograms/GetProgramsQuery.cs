using KecCerts.Application.Common.Models;
using MediatR;

namespace KecCerts.Application.Programs.Queries.GetPrograms;

public record GetProgramsQuery(
    int PageNumber = 1,
    int PageSize = 20,
    string? SearchTerm = null,
    bool? IsActive = null) : IRequest<PaginatedList<ProgramDto>>;

public record ProgramDto(
    Guid Id,
    string Code,
    string Name,
    string? Description,
    bool IsActive,
    Guid? ActiveTemplateId,
    string? ActiveTemplateName,
    int CertificateCount,
    DateTime CreatedAt);
