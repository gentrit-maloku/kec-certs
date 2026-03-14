using KecCerts.Application.Common.Models;
using MediatR;

namespace KecCerts.Application.Certificates.Commands.ImportCertificates;

public record ImportCertificatesCommand(
    Stream FileStream,
    string FileName,
    bool ContinueOnErrors = true) : IRequest<ImportCertificatesResult>;

public record ImportCertificatesResult(
    Guid? BatchId,
    int TotalCount,
    int SuccessCount,
    int ErrorCount,
    int WarningCount,
    List<ImportError> Errors,
    List<ImportError> Warnings,
    int NextSerialNumber);
