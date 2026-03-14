using KecCerts.Application.Common.Models;
using MediatR;

namespace KecCerts.Application.Templates.Queries.GetTemplates;

public record GetTemplatesQuery(
    int PageNumber = 1,
    int PageSize = 20,
    Guid? TrainingProgramId = null) : IRequest<PaginatedList<TemplateDto>>;

public record TemplateDto(
    Guid Id,
    string Name,
    string? Description,
    string? CertificationType,
    string TemplateFileKey,
    List<string> Placeholders,
    string? Logo1FileKey,
    string? Logo2FileKey,
    string? Logo3FileKey,
    string? Signature1FileKey,
    string? Signature1Name,
    string? Signature2FileKey,
    string? Signature2Name,
    string? Signature3FileKey,
    string? Signature3Name,
    string Location,
    Guid? TrainingProgramId,
    string? TrainingProgramName,
    string? TrainingProgramCode,
    bool IsActive,
    DateTime CreatedAt);
