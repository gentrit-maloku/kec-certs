using MediatR;

namespace KecCerts.Application.Reports.Queries.ExportData;

public record ExportCertificatesQuery(
    string Format,
    string? SearchTerm = null,
    Guid? TrainingProgramId = null,
    DateOnly? FromDate = null,
    DateOnly? ToDate = null,
    int? FromSerial = null,
    int? ToSerial = null) : IRequest<ExportResult>;

public record ExportResult(byte[] Content, string ContentType, string FileName);
