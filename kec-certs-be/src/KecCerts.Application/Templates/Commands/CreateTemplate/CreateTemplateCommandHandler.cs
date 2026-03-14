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
        // Save template file
        var fileKey = await SaveStream(request.FileStream, "templates", request.FileName, cancellationToken);

        // Save logos
        var logo1Key = await SaveStream(request.Logo1Stream, "templates/logos", request.Logo1FileName, cancellationToken);
        var logo2Key = await SaveStream(request.Logo2Stream, "templates/logos", request.Logo2FileName, cancellationToken);
        var logo3Key = await SaveStream(request.Logo3Stream, "templates/logos", request.Logo3FileName, cancellationToken);

        // Save signatures
        var sig1Key = await SaveStream(request.Signature1Stream, "templates/signatures", request.Signature1FileName, cancellationToken);
        var sig2Key = await SaveStream(request.Signature2Stream, "templates/signatures", request.Signature2FileName, cancellationToken);
        var sig3Key = await SaveStream(request.Signature3Stream, "templates/signatures", request.Signature3FileName, cancellationToken);

        var template = new CertificateTemplate
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            CertificationType = request.CertificationType,
            Location = request.Location,
            TemplateFileKey = fileKey ?? "auto-generated",
            TrainingProgramId = request.TrainingProgramId,
            PlaceholdersJson = JsonSerializer.Serialize(request.Placeholders),
            Logo1FileKey = logo1Key,
            Logo2FileKey = logo2Key,
            Logo3FileKey = logo3Key,
            Signature1FileKey = sig1Key,
            Signature1Name = request.Signature1Name,
            Signature2FileKey = sig2Key,
            Signature2Name = request.Signature2Name,
            Signature3FileKey = sig3Key,
            Signature3Name = request.Signature3Name,
            CreatedByUserId = currentUser.UserId
        };

        dbContext.CertificateTemplates.Add(template);
        await dbContext.SaveChangesAsync(cancellationToken);

        return template.Id;
    }

    private async Task<string?> SaveStream(Stream? stream, string folder, string? fileName, CancellationToken ct)
    {
        if (stream == null || string.IsNullOrEmpty(fileName)) return null;
        using var ms = new MemoryStream();
        await stream.CopyToAsync(ms, ct);
        return await fileStorage.SaveFileAsync(ms.ToArray(), folder, fileName, ct);
    }
}
