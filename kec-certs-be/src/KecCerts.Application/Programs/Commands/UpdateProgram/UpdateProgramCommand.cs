using MediatR;

namespace KecCerts.Application.Programs.Commands.UpdateProgram;

public record UpdateProgramCommand(
    Guid Id,
    string Name,
    string? Description,
    bool IsActive,
    int? NumberOfHours,
    DateOnly? RegistrationDate,
    string? Status,
    DateOnly? AccreditationFrom,
    DateOnly? AccreditationTo) : IRequest;
