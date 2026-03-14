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
        var today = DateOnly.FromDateTime(now);
        var soon = DateOnly.FromDateTime(now.AddDays(30));
        var startOfMonth = new DateOnly(now.Year, now.Month, 1);
        var startOfYear = new DateOnly(now.Year, 1, 1);

        var totalCerts = await context.Certificates.CountAsync(cancellationToken);
        var totalPrograms = await context.TrainingPrograms.CountAsync(cancellationToken);
        var totalBatches = await context.BulkGenerationBatches.CountAsync(cancellationToken);

        var certsThisMonth = await context.Certificates
            .Where(c => c.IssueDate >= startOfMonth)
            .CountAsync(cancellationToken);

        var certsThisYear = await context.Certificates
            .Where(c => c.IssueDate >= startOfYear)
            .CountAsync(cancellationToken);

        // Get certificate counts per program using groupBy on certificates
        var certCounts = await context.Certificates
            .Where(c => c.TrainingProgramId != null)
            .GroupBy(c => c.TrainingProgramId)
            .Select(g => new { ProgramId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var programs = await context.TrainingPrograms
            .AsNoTracking()
            .Select(p => new { p.Id, p.Name, p.Code })
            .ToListAsync(cancellationToken);

        var byProgram = programs
            .Select(p => new ProgramCertificateCountDto(
                p.Id, p.Name, p.Code,
                certCounts.FirstOrDefault(c => c.ProgramId == p.Id)?.Count ?? 0))
            .OrderByDescending(x => x.CertificateCount)
            .Take(10)
            .ToList();

        // Accreditation alerts
        var programsWithAccreditation = await context.TrainingPrograms
            .AsNoTracking()
            .Where(p => p.AccreditationTo.HasValue && p.IsActive)
            .Select(p => new { p.Id, p.Code, p.Name, p.AccreditationTo })
            .ToListAsync(cancellationToken);

        var alerts = new List<AccreditationAlertDto>();
        foreach (var p in programsWithAccreditation)
        {
            if (p.AccreditationTo!.Value < today)
            {
                alerts.Add(new AccreditationAlertDto(p.Id, p.Code, p.Name, p.AccreditationTo, "expired"));
            }
            else if (p.AccreditationTo.Value <= soon)
            {
                alerts.Add(new AccreditationAlertDto(p.Id, p.Code, p.Name, p.AccreditationTo, "expiring_soon"));
            }
        }

        return new DashboardStatisticsDto(
            totalCerts, totalPrograms, totalBatches,
            certsThisMonth, certsThisYear, byProgram, alerts);
    }
}
