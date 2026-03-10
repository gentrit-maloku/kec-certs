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
    string TemplateFileKey,
    List<string> Placeholders,
    Guid? TrainingProgramId,
    string? TrainingProgramName,
    bool IsActive,
    DateTime CreatedAt);
