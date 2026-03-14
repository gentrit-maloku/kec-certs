using KecCerts.Application.Common.Interfaces;
using KecCerts.Domain.Entities;
using KecCerts.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KecCerts.Application.Programs.Commands.CreateProgram;

public class CreateProgramCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser)
    : IRequestHandler<CreateProgramCommand, Guid>
{
    public async Task<Guid> Handle(CreateProgramCommand request, CancellationToken cancellationToken)
    {
        var exists = await context.TrainingPrograms
            .AnyAsync(p => p.Code == request.Code, cancellationToken);

        if (exists)
            throw new DuplicateException(nameof(TrainingProgram), nameof(TrainingProgram.Code), request.Code);

        var program = new TrainingProgram
        {
            Id = Guid.NewGuid(),
            Code = request.Code,
            Name = request.Name,
            Description = request.Description,
            NumberOfHours = request.NumberOfHours,
            RegistrationDate = request.RegistrationDate,
            Status = request.Status,
            AccreditationFrom = request.AccreditationFrom,
            AccreditationTo = request.AccreditationTo,
            CreatedByUserId = currentUser.UserId
        };

        context.TrainingPrograms.Add(program);
        await context.SaveChangesAsync(cancellationToken);

        return program.Id;
    }
}
