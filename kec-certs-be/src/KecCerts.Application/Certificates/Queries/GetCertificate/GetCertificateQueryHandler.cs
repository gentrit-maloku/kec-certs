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
                c.FileKey,
                c.GenerationMethod.ToString(),
                c.TrainingProgramId,
                c.TrainingProgram != null ? c.TrainingProgram.Name : null,
                c.TrainingProgram != null ? c.TrainingProgram.Code : null,
                c.BatchId,
                c.CreatedAt))
            .FirstOrDefaultAsync(cancellationToken);
    }
}
