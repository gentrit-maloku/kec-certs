using System.Text.Json;
using KecCerts.Application.Common.Interfaces;
using KecCerts.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KecCerts.Application.Templates.Queries.GetTemplates;

public class GetTemplatesQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetTemplatesQuery, PaginatedList<TemplateDto>>
{
    public async Task<PaginatedList<TemplateDto>> Handle(
        GetTemplatesQuery request, CancellationToken cancellationToken)
    {
        var query = context.CertificateTemplates.AsNoTracking().AsQueryable();

        if (request.TrainingProgramId.HasValue)
            query = query.Where(t => t.TrainingProgramId == request.TrainingProgramId.Value);

        var projected = query
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new TemplateDto(
                t.Id,
                t.Name,
                t.Description,
                t.TemplateFileKey,
                JsonSerializer.Deserialize<List<string>>(t.PlaceholdersJson, (JsonSerializerOptions?)null) ?? new List<string>(),
                t.TrainingProgramId,
                t.TrainingProgram != null ? t.TrainingProgram.Name : null,
                t.IsActive,
                t.CreatedAt));

        return await PaginatedList<TemplateDto>.CreateAsync(
            projected, request.PageNumber, request.PageSize, cancellationToken);
    }
}
