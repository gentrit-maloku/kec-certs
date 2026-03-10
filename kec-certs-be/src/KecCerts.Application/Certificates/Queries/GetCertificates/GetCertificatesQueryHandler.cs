using KecCerts.Application.Common.Interfaces;
using KecCerts.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KecCerts.Application.Certificates.Queries.GetCertificates;

public class GetCertificatesQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetCertificatesQuery, PaginatedList<CertificateListDto>>
{
    public async Task<PaginatedList<CertificateListDto>> Handle(
        GetCertificatesQuery request, CancellationToken cancellationToken)
    {
        var query = context.Certificates.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.ToLower();
            query = query.Where(c =>
                c.ParticipantFirstName.ToLower().Contains(term) ||
                c.ParticipantLastName.ToLower().Contains(term) ||
                c.SerialNumber.ToLower().Contains(term) ||
                (c.ParticipantPersonalNumber != null && c.ParticipantPersonalNumber.ToLower().Contains(term)));
        }

        if (request.TrainingProgramId.HasValue)
            query = query.Where(c => c.TrainingProgramId == request.TrainingProgramId.Value);

        if (request.FromDate.HasValue)
            query = query.Where(c => c.IssueDate >= request.FromDate.Value);

        if (request.ToDate.HasValue)
            query = query.Where(c => c.IssueDate <= request.ToDate.Value);

        var projected = query
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new CertificateListDto(
                c.Id,
                c.SerialNumber,
                c.ParticipantFirstName,
                c.ParticipantLastName,
                c.ParticipantPersonalNumber,
                c.IssueDate,
                c.Grade,
                c.TrainingProgram.Name,
                c.TrainingProgram.Code,
                c.GenerationMethod.ToString(),
                c.CreatedAt));

        return await PaginatedList<CertificateListDto>.CreateAsync(
            projected, request.PageNumber, request.PageSize, cancellationToken);
    }
}
