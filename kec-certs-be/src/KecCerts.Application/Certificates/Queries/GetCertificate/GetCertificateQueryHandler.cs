using KecCerts.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KecCerts.Application.Certificates.Queries.GetCertificate;

public class GetCertificateQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetCertificateQuery, CertificateDetailDto?>
{
    public async Task<CertificateDetailDto?> Handle(
        GetCertificateQuery request, CancellationToken cancellationToken)
    {
        return await context.Certificates
            .AsNoTracking()
            .Where(c => c.Id == request.Id)
            .Select(c => new CertificateDetailDto(
                c.Id,
                c.SerialNumber,
                c.ParticipantFirstName,
                c.ParticipantLastName,
                c.ParticipantPersonalNumber,
                c.IssueDate,
                c.Grade,
                c.FileKey,
                c.GenerationMethod.ToString(),
                c.TrainingProgramId,
                c.TrainingProgram.Name,
                c.TrainingProgram.Code,
                c.BatchId,
                c.CreatedAt))
            .FirstOrDefaultAsync(cancellationToken);
    }
}
