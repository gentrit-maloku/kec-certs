using MediatR;

namespace KecCerts.Application.Templates.Commands.ActivateTemplate;

public record ActivateTemplateCommand(
    Guid TemplateId,
    Guid TrainingProgramId) : IRequest;
