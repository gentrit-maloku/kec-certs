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
        if (request.FromSerial.HasValue)
        {
            var fromStr = request.FromSerial.Value.ToString();
            query = query.Where(c =>
                c.SerialNumber.Length > fromStr.Length ||
                (c.SerialNumber.Length == fromStr.Length && c.SerialNumber.CompareTo(fromStr) >= 0));
        }
        if (request.ToSerial.HasValue)
        {
            var toStr = request.ToSerial.Value.ToString();
            query = query.Where(c =>
                c.SerialNumber.Length < toStr.Length ||
                (c.SerialNumber.Length == toStr.Length && c.SerialNumber.CompareTo(toStr) <= 0));
        }

        // Sort by serial number descending (newest first)
        var projected = query
            .OrderByDescending(c => c.SerialNumber.Length)
            .ThenByDescending(c => c.SerialNumber)
            .Select(c => new CertificateListDto(
                c.Id,
                c.SerialNumber,
                c.IssueDate,
                c.TrainingCode,
                c.TrainingName,
                c.ParticipantFullName,
                c.PersonalNumber,
                c.TrainingGroup,
                c.Gender,
                c.Position,
                c.Subject,
                c.InstitutionName,
                c.InstitutionLocation,
                c.Municipality,
                c.InstitutionType,
                c.TrainingDates,
                c.CreatedAt));

        return await PaginatedList<CertificateListDto>.CreateAsync(
            projected, request.PageNumber, request.PageSize, cancellationToken);
    }
}
