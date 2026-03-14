using KecCerts.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KecCerts.Application.Reports.Queries.PrintCertificates;

public class PrintCertificatesQueryHandler(
    IApplicationDbContext context,
    ICertificateGenerator certificateGenerator)
    : IRequestHandler<PrintCertificatesQuery, byte[]>
{
    public async Task<byte[]> Handle(PrintCertificatesQuery request, CancellationToken cancellationToken)
    {
        var query = context.Certificates.AsNoTracking()
            .Include(c => c.Template)
            .AsQueryable();

        // Apply same filters as ExportCertificatesQueryHandler
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

        var certs = await query
            .OrderByDescending(c => c.SerialNumber.Length)
            .ThenByDescending(c => c.SerialNumber)
            .ToListAsync(cancellationToken);

        // Serial number range filter (in-memory like ExportHandler)
        if (request.FromSerial.HasValue || request.ToSerial.HasValue)
        {
            certs = certs.Where(c =>
            {
                if (!int.TryParse(c.SerialNumber, out var num)) return false;
                if (request.FromSerial.HasValue && num < request.FromSerial.Value) return false;
                if (request.ToSerial.HasValue && num > request.ToSerial.Value) return false;
                return true;
            }).ToList();
        }

        var certDataList = certs.Select(c => new CertificateGenerationData
        {
            SerialNumber = c.SerialNumber,
            IssueDate = c.IssueDate.ToString("dd.MM.yyyy"),
            TrainingCode = c.TrainingCode,
            TrainingName = c.TrainingName,
            ParticipantFullName = c.ParticipantFullName,
            CertificationType = c.Template?.CertificationType,
            Location = c.Template?.Location ?? "Prishtinë",
            Logo1FileKey = c.Template?.Logo1FileKey,
            Logo2FileKey = c.Template?.Logo2FileKey,
            Logo3FileKey = c.Template?.Logo3FileKey,
            Signature1FileKey = c.Template?.Signature1FileKey,
            Signature1Name = c.Template?.Signature1Name,
            Signature2FileKey = c.Template?.Signature2FileKey,
            Signature2Name = c.Template?.Signature2Name,
            Signature3FileKey = c.Template?.Signature3FileKey,
            Signature3Name = c.Template?.Signature3Name,
        }).ToList();

        return await certificateGenerator.GenerateBulkPdfAsync(certDataList, cancellationToken);
    }
}
