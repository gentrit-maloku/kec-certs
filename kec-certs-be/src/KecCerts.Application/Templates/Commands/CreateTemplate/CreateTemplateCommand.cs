using MediatR;

namespace KecCerts.Application.Templates.Commands.CreateTemplate;

public record CreateTemplateCommand(
    string Name,
    string? Description,
    string? CertificationType,
    string Location,
    Stream? FileStream,
    string? FileName,
    Guid? TrainingProgramId,
    List<string> Placeholders,
    // Logo streams (nullable)
    Stream? Logo1Stream,
    string? Logo1FileName,
    Stream? Logo2Stream,
    string? Logo2FileName,
    Stream? Logo3Stream,
    string? Logo3FileName,
    // Signature streams + names
    Stream? Signature1Stream,
    string? Signature1FileName,
    string? Signature1Name,
    Stream? Signature2Stream,
    string? Signature2FileName,
    string? Signature2Name,
    Stream? Signature3Stream,
    string? Signature3FileName,
    string? Signature3Name) : IRequest<Guid>;
