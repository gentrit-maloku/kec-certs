using MediatR;

namespace KecCerts.Application.Reports.Queries.ExportData;

public record ExportCertificatesQuery(
    string Format,
    Guid? TrainingProgramId = null,
    DateOnly? FromDate = null,
    DateOnly? ToDate = null) : IRequest<ExportResult>;

public record ExportResult(byte[] Content, string ContentType, string FileName);
