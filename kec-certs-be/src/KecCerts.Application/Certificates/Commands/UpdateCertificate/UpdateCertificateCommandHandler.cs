using KecCerts.Application.Common.Interfaces;
using KecCerts.Domain.Entities;
using KecCerts.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KecCerts.Application.Certificates.Commands.UpdateCertificate;

public class UpdateCertificateCommandHandler(
    IApplicationDbContext dbContext,
    ICurrentUserService currentUser)
    : IRequestHandler<UpdateCertificateCommand, UpdateCertificateResult>
{
    public async Task<UpdateCertificateResult> Handle(
        UpdateCertificateCommand request, CancellationToken cancellationToken)
    {
        var certificate = await dbContext.Certificates
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Certificate), request.Id);

        certificate.IssueDate = request.IssueDate;
        certificate.TrainingCode = request.TrainingCode;
        certificate.TrainingName = request.TrainingName;
        certificate.ParticipantFullName = request.ParticipantFullName;
        certificate.PersonalNumber = request.PersonalNumber;
        certificate.TrainingGroup = request.TrainingGroup;
        certificate.Gender = request.Gender;
        certificate.Position = request.Position;
        certificate.Subject = request.Subject;
        certificate.InstitutionName = request.InstitutionName;
        certificate.InstitutionLocation = request.InstitutionLocation;
        certificate.Municipality = request.Municipality;
        certificate.InstitutionType = request.InstitutionType;
        certificate.TrainingDates = request.TrainingDates;
        certificate.UpdatedByUserId = currentUser.UserId;

        // Try to match training code to program
        var program = await dbContext.TrainingPrograms
            .FirstOrDefaultAsync(p => p.Code == request.TrainingCode, cancellationToken);

        if (program != null)
            certificate.TrainingProgramId = program.Id;

        await dbContext.SaveChangesAsync(cancellationToken);

        return new UpdateCertificateResult(certificate.Id, certificate.SerialNumber);
    }
}
