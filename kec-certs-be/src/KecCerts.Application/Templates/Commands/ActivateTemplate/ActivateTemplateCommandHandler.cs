using KecCerts.Application.Common.Interfaces;
using KecCerts.Domain.Entities;
using KecCerts.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KecCerts.Application.Templates.Commands.ActivateTemplate;

public class ActivateTemplateCommandHandler(
    IApplicationDbContext dbContext,
    ICurrentUserService currentUser)
    : IRequestHandler<ActivateTemplateCommand>
{
    public async Task Handle(ActivateTemplateCommand request, CancellationToken cancellationToken)
    {
        var template = await dbContext.CertificateTemplates
            .FirstOrDefaultAsync(t => t.Id == request.TemplateId, cancellationToken)
            ?? throw new NotFoundException(nameof(CertificateTemplate), request.TemplateId);

        var program = await dbContext.TrainingPrograms
            .FirstOrDefaultAsync(p => p.Id == request.TrainingProgramId, cancellationToken)
            ?? throw new NotFoundException(nameof(TrainingProgram), request.TrainingProgramId);

        program.ActiveTemplateId = template.Id;
        program.UpdatedAt = DateTime.UtcNow;
        program.UpdatedByUserId = currentUser.UserId;

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
