using MediatR;

namespace KecCerts.Application.Templates.Commands.CreateTemplate;

public record CreateTemplateCommand(
    string Name,
    string? Description,
    Stream FileStream,
    string FileName,
    Guid? TrainingProgramId,
    List<string> Placeholders) : IRequest<Guid>;
