using KecCerts.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KecCerts.Application.Reports.Queries.ExportData;

public class ExportCertificatesQueryHandler(
    IApplicationDbContext context,
    IExportService exportService)
    : IRequestHandler<ExportCertificatesQuery, ExportResult>
{
    public async Task<ExportResult> Handle(
        ExportCertificatesQuery request, CancellationToken cancellationToken)
    {
        var query = context.Certificates.AsNoTracking()
            .Include(c => c.TrainingProgram)
            .AsQueryable();

        if (request.TrainingProgramId.HasValue)
            query = query.Where(c => c.TrainingProgramId == request.TrainingProgramId.Value);
        if (request.FromDate.HasValue)
            query = query.Where(c => c.IssueDate >= request.FromDate.Value);
        if (request.ToDate.HasValue)
            query = query.Where(c => c.IssueDate <= request.ToDate.Value);

        var data = await query
            .OrderByDescending(c => c.IssueDate)
            .Select(c => new
            {
                c.SerialNumber,
                c.ParticipantFirstName,
                c.ParticipantLastName,
                c.ParticipantPersonalNumber,
                IssueDate = c.IssueDate.ToString("dd.MM.yyyy"),
                c.Grade,
                ProgramName = c.TrainingProgram.Name,
                ProgramCode = c.TrainingProgram.Code
            })
            .ToListAsync(cancellationToken);

        return request.Format.ToLower() switch
        {
            "csv" => new ExportResult(
                await exportService.ExportToCsvAsync(data, cancellationToken),
                "text/csv",
                $"certificates_{DateTime.UtcNow:yyyyMMdd}.csv"),
            "xlsx" => new ExportResult(
                await exportService.ExportToExcelAsync(data, "Certificates", cancellationToken),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"certificates_{DateTime.UtcNow:yyyyMMdd}.xlsx"),
            "pdf" => new ExportResult(
                await exportService.ExportToPdfAsync(data, "Certificate Report", cancellationToken),
                "application/pdf",
                $"certificates_{DateTime.UtcNow:yyyyMMdd}.pdf"),
            _ => throw new ArgumentException($"Unsupported export format: {request.Format}")
        };
    }
}
