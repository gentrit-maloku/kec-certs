using FluentValidation;

namespace KecCerts.Application.Certificates.Commands.GenerateCertificate;

public class GenerateCertificateCommandValidator : AbstractValidator<GenerateCertificateCommand>
{
    public GenerateCertificateCommandValidator()
    {
        RuleFor(x => x.SerialNumber).NotEmpty().MaximumLength(100);
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.PersonalNumber).MaximumLength(50);
        RuleFor(x => x.IssueDate).NotEmpty();
        RuleFor(x => x.TrainingProgramId).NotEmpty();
    }
}
