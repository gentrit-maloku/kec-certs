using MediatR;

namespace KecCerts.Application.Reports.Queries.PrintCertificates;

public record PrintCertificatesQuery(
    string? SearchTerm,
    Guid? TrainingProgramId,
    DateOnly? FromDate,
    DateOnly? ToDate,
    int? FromSerial,
    int? ToSerial) : IRequest<byte[]>;
