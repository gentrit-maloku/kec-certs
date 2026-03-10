using KecCerts.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KecCerts.Application.Reports.Queries.GetStatistics;

public class GetStatisticsQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetStatisticsQuery, DashboardStatisticsDto>
{
    public async Task<DashboardStatisticsDto> Handle(
        GetStatisticsQuery request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var startOfMonth = new DateOnly(now.Year, now.Month, 1);
        var startOfYear = new DateOnly(now.Year, 1, 1);

        var totalCerts = await context.Certificates.CountAsync(cancellationToken);
        var totalPrograms = await context.TrainingPrograms.CountAsync(cancellationToken);
        var totalBatches = await context.BulkGenerationBatches.CountAsync(cancellationToken);

        var certsThisMonth = await context.Certificates
            .CountAsync(c => c.IssueDate >= startOfMonth, cancellationToken);

        var certsThisYear = await context.Certificates
            .CountAsync(c => c.IssueDate >= startOfYear, cancellationToken);

        var byProgram = await context.TrainingPrograms
            .AsNoTracking()
            .Select(p => new ProgramCertificateCountDto(
                p.Id, p.Name, p.Code, p.Certificates.Count))
            .OrderByDescending(x => x.CertificateCount)
            .Take(10)
            .ToListAsync(cancellationToken);

        return new DashboardStatisticsDto(
            totalCerts, totalPrograms, totalBatches,
            certsThisMonth, certsThisYear, byProgram);
    }
}
