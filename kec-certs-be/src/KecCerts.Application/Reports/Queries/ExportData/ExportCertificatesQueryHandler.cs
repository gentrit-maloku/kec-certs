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

        // Search term filter
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.ToLower();
            query = query.Where(c =>
                c.ParticipantFullName.ToLower().Contains(term) ||
                c.SerialNumber.ToLower().Contains(term) ||
                c.TrainingCode.ToLower().Contains(term) ||
                c.TrainingName.ToLower().Contains(term) ||
                (c.PersonalNumber != null && c.PersonalNumber.ToLower().Contains(term)));
        }

        if (request.TrainingProgramId.HasValue)
            query = query.Where(c => c.TrainingProgramId == request.TrainingProgramId.Value);
        if (request.FromDate.HasValue)
            query = query.Where(c => c.IssueDate >= request.FromDate.Value);
        if (request.ToDate.HasValue)
            query = query.Where(c => c.IssueDate <= request.ToDate.Value);

        // Serial number range filter
        if (request.FromSerial.HasValue || request.ToSerial.HasValue)
        {
            var allCerts = await query.Select(c => new { c.Id, c.SerialNumber }).ToListAsync(cancellationToken);
            var filteredIds = allCerts
                .Where(c =>
                {
                    if (!int.TryParse(c.SerialNumber, out var num)) return false;
                    if (request.FromSerial.HasValue && num < request.FromSerial.Value) return false;
                    if (request.ToSerial.HasValue && num > request.ToSerial.Value) return false;
                    return true;
                })
                .Select(c => c.Id)
                .ToHashSet();

            query = query.Where(c => filteredIds.Contains(c.Id));
        }

        var data = await query
            .OrderByDescending(c => c.SerialNumber.Length)
            .ThenByDescending(c => c.SerialNumber)
            .Select(c => new
            {
                NrRendor = c.SerialNumber,
                DataLeshimit = c.IssueDate.ToString("dd.MM.yyyy"),
                KodiTrajnimit = c.TrainingCode,
                EmriTrajnimit = c.TrainingName,
                EmriDheMbiemri = c.ParticipantFullName,
                NumriPersonal = c.PersonalNumber ?? "",
                GrupiTrajnimit = c.TrainingGroup ?? "",
                Gjinia = c.Gender ?? "",
                Pozita = c.Position ?? "",
                Lenda = c.Subject ?? "",
                EmriInstitucionit = c.InstitutionName ?? "",
                VendiInstitucionit = c.InstitutionLocation ?? "",
                Komuna = c.Municipality ?? "",
                TipiInstitucionit = c.InstitutionType ?? "",
                DatatTrajnimit = c.TrainingDates ?? ""
            })
            .ToListAsync(cancellationToken);

        return request.Format.ToLower() switch
        {
            "csv" => new ExportResult(
                await exportService.ExportToCsvAsync(data, cancellationToken),
                "text/csv",
                $"certifikata_{DateTime.UtcNow:yyyyMMdd}.csv"),
            "xlsx" => new ExportResult(
                await exportService.ExportToExcelAsync(data, "Certifikata", cancellationToken),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"certifikata_{DateTime.UtcNow:yyyyMMdd}.xlsx"),
            "pdf" => new ExportResult(
                await exportService.ExportToPdfAsync(data, "Raporti i Certifikatave", cancellationToken),
                "application/pdf",
                $"certifikata_{DateTime.UtcNow:yyyyMMdd}.pdf"),
            _ => throw new ArgumentException($"Unsupported export format: {request.Format}")
        };
    }
}
