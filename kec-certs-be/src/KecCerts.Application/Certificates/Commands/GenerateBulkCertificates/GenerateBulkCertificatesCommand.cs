using MediatR;

namespace KecCerts.Application.Certificates.Commands.GenerateBulkCertificates;

public record GenerateBulkCertificatesCommand(
    Stream FileStream,
    string FileName,
    Guid TrainingProgramId) : IRequest<BulkGenerationResult>;

public record BulkGenerationResult(
    Guid BatchId,
    int TotalCount,
    int SuccessCount,
    int ErrorCount,
    List<string> Errors,
    string? ZipFileKey);
