using MediatR;

namespace KecCerts.Application.Programs.Commands.UpdateProgram;

public record UpdateProgramCommand(
    Guid Id,
    string Name,
    string? Description,
    bool IsActive) : IRequest;
