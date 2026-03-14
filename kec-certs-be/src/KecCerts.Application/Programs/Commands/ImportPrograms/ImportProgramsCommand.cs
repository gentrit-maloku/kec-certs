using MediatR;

namespace KecCerts.Application.Programs.Commands.ImportPrograms;

public record ImportProgramsCommand(Stream FileStream) : IRequest<ImportProgramsResult>;

public record ImportProgramsResult(
    int Created,
    int Updated,
    int Skipped,
    List<string> Errors);
