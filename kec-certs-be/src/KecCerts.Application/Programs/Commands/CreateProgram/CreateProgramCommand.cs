using MediatR;

namespace KecCerts.Application.Programs.Commands.CreateProgram;

public record CreateProgramCommand(
    string Code,
    string Name,
    string? Description) : IRequest<Guid>;
