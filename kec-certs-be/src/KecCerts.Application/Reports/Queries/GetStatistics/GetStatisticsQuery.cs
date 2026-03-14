using MediatR;

namespace KecCerts.Application.Reports.Queries.GetStatistics;

public record GetStatisticsQuery : IRequest<DashboardStatisticsDto>;

public record DashboardStatisticsDto(
    int TotalCertificates,
    int TotalPrograms,
    int TotalBatches,
    int CertificatesThisMonth,
    int CertificatesThisYear,
    List<ProgramCertificateCountDto> CertificatesByProgram,
    List<AccreditationAlertDto> AccreditationAlerts);

public record ProgramCertificateCountDto(
    Guid ProgramId,
    string ProgramName,
    string ProgramCode,
    int CertificateCount);

public record AccreditationAlertDto(
    Guid ProgramId,
    string ProgramCode,
    string ProgramName,
    DateOnly? AccreditationTo,
    string AlertType); // "expired" or "expiring_soon"
