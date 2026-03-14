using FluentValidation;

namespace KecCerts.Application.Certificates.Commands.GenerateCertificate;

public class GenerateCertificateCommandValidator : AbstractValidator<GenerateCertificateCommand>
{
    public GenerateCertificateCommandValidator()
    {
        RuleFor(x => x.SerialNumber).NotEmpty().MaximumLength(100);
        RuleFor(x => x.ParticipantFullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.TrainingCode).NotEmpty().MaximumLength(100);
        RuleFor(x => x.TrainingName).NotEmpty().MaximumLength(500);
        RuleFor(x => x.IssueDate).NotEmpty();
        RuleFor(x => x.TrainingProgramId).NotEmpty();
    }
}
