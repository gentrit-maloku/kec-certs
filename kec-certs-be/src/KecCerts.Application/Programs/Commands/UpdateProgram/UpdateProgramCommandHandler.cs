using KecCerts.Application.Common.Interfaces;
using KecCerts.Domain.Entities;
using KecCerts.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KecCerts.Application.Programs.Commands.UpdateProgram;

public class UpdateProgramCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser)
    : IRequestHandler<UpdateProgramCommand>
{
    public async Task Handle(UpdateProgramCommand request, CancellationToken cancellationToken)
    {
        var program = await context.TrainingPrograms
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(TrainingProgram), request.Id);

        program.Name = request.Name;
        program.Description = request.Description;
        program.IsActive = request.IsActive;
        program.NumberOfHours = request.NumberOfHours;
        program.RegistrationDate = request.RegistrationDate;
        program.Status = request.Status;
        program.AccreditationFrom = request.AccreditationFrom;
        program.AccreditationTo = request.AccreditationTo;
        program.UpdatedAt = DateTime.UtcNow;
        program.UpdatedByUserId = currentUser.UserId;

        await context.SaveChangesAsync(cancellationToken);
    }
}
