using System.Text.Json;
using KecCerts.Application.Common.Interfaces;
using KecCerts.Domain.Entities;
using MediatR;

namespace KecCerts.Application.Templates.Commands.CreateTemplate;

public class CreateTemplateCommandHandler(
    IApplicationDbContext dbContext,
    ICurrentUserService currentUser,
    IFileStorageService fileStorage)
    : IRequestHandler<CreateTemplateCommand, Guid>
{
    public async Task<Guid> Handle(CreateTemplateCommand request, CancellationToken cancellationToken)
    {
        using var ms = new MemoryStream();
        await request.FileStream.CopyToAsync(ms, cancellationToken);
        var fileBytes = ms.ToArray();

        var fileKey = await fileStorage.SaveFileAsync(
            fileBytes, "templates", request.FileName, cancellationToken);

        var template = new CertificateTemplate
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            TemplateFileKey = fileKey,
            TrainingProgramId = request.TrainingProgramId,
            PlaceholdersJson = JsonSerializer.Serialize(request.Placeholders),
            CreatedByUserId = currentUser.UserId
        };

        dbContext.CertificateTemplates.Add(template);
        await dbContext.SaveChangesAsync(cancellationToken);

        return template.Id;
    }
}
