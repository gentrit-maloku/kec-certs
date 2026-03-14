using KecCerts.Application.Common.Models;

namespace KecCerts.Application.Common.Interfaces;

public interface IExcelParser
{
    /// <summary>
    /// Parses an Excel file and returns participant rows for bulk certificate generation.
    /// </summary>
    Task<ExcelParseResult> ParseCertificateDataAsync(Stream fileStream, CancellationToken cancellationToken = default);

    /// <summary>
    /// Parses an Excel file ("Libri i programeve të trajnimit") and returns program rows.
    /// </summary>
    Task<ProgramParseResult> ParseProgramDataAsync(Stream fileStream, CancellationToken cancellationToken = default);
}
