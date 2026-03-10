using KecCerts.Application.Common.Interfaces;
using KecCerts.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KecCerts.Application.Programs.Queries.GetPrograms;

public class GetProgramsQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetProgramsQuery, PaginatedList<ProgramDto>>
{
    public async Task<PaginatedList<ProgramDto>> Handle(
        GetProgramsQuery request, CancellationToken cancellationToken)
    {
        var query = context.TrainingPrograms.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(term) ||
                p.Code.ToLower().Contains(term));
        }

        if (request.IsActive.HasValue)
            query = query.Where(p => p.IsActive == request.IsActive.Value);

        var projected = query
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProgramDto(
                p.Id,
                p.Code,
                p.Name,
                p.Description,
                p.IsActive,
                p.ActiveTemplateId,
                p.ActiveTemplate != null ? p.ActiveTemplate.Name : null,
                p.Certificates.Count,
                p.CreatedAt));

        return await PaginatedList<ProgramDto>.CreateAsync(
            projected, request.PageNumber, request.PageSize, cancellationToken);
    }
}
