using ClosedXML.Excel;
using KecCerts.Application.Common.Interfaces;
using KecCerts.Application.Common.Models;

namespace KecCerts.Infrastructure.Services;

public class ExcelParserService : IExcelParser
{
    public Task<ExcelParseResult> ParseCertificateDataAsync(Stream fileStream, CancellationToken cancellationToken = default)
    {
        var result = new ExcelParseResult();

        using var workbook = new XLWorkbook(fileStream);
        var worksheet = workbook.Worksheets.FirstOrDefault();

        if (worksheet is null)
        {
            result.Errors.Add("Excel file contains no worksheets.");
            return Task.FromResult(result);
        }

        var rows = worksheet.RangeUsed()?.RowsUsed().Skip(1).ToList(); // Skip header row
        if (rows is null || rows.Count == 0)
        {
            result.Errors.Add("Excel file contains no data rows.");
            return Task.FromResult(result);
        }

        var seenSerials = new HashSet<string>();

        for (int i = 0; i < rows.Count; i++)
        {
            var row = rows[i];
            var rowNumber = i + 2; // 1-based, +1 for header

            var programCode = row.Cell(1).GetString().Trim();
            var programName = row.Cell(2).GetString().Trim();
            var firstName = row.Cell(3).GetString().Trim();
            var lastName = row.Cell(4).GetString().Trim();
            var personalNumber = row.Cell(5).GetString().Trim();
            var serialNumber = row.Cell(6).GetString().Trim();
            var issueDateStr = row.Cell(7).GetString().Trim();
            var grade = row.Cell(8).GetString().Trim();

            // Validate required fields
            if (string.IsNullOrEmpty(firstName))
            {
                result.Errors.Add($"Row {rowNumber}: First name is required.");
                continue;
            }
            if (string.IsNullOrEmpty(lastName))
            {
                result.Errors.Add($"Row {rowNumber}: Last name is required.");
                continue;
            }
            if (string.IsNullOrEmpty(serialNumber))
            {
                result.Errors.Add($"Row {rowNumber}: Serial number is required.");
                continue;
            }

            // Check for duplicate serial numbers within the file
            if (!seenSerials.Add(serialNumber))
            {
                result.Errors.Add($"Row {rowNumber}: Duplicate serial number '{serialNumber}' within file.");
                continue;
            }

            // Parse date
            if (!TryParseDate(issueDateStr, row.Cell(7), out var issueDate))
            {
                result.Errors.Add($"Row {rowNumber}: Invalid date format '{issueDateStr}'. Expected dd.MM.yyyy or dd/MM/yyyy.");
                continue;
            }

            result.Rows.Add(new ParticipantRow(
                string.IsNullOrEmpty(programCode) ? null : programCode,
                string.IsNullOrEmpty(programName) ? null : programName,
                firstName,
                lastName,
                string.IsNullOrEmpty(personalNumber) ? null : personalNumber,
                serialNumber,
                issueDate,
                string.IsNullOrEmpty(grade) ? null : grade,
                rowNumber));
        }

        return Task.FromResult(result);
    }

    private static bool TryParseDate(string dateStr, IXLCell cell, out DateOnly result)
    {
        result = default;

        // Try to get DateTime directly from cell (Excel date format)
        if (cell.DataType == XLDataType.DateTime)
        {
            var dt = cell.GetDateTime();
            result = DateOnly.FromDateTime(dt);
            return true;
        }

        // Try common Albanian/European date formats
        string[] formats = ["dd.MM.yyyy", "dd/MM/yyyy", "d.M.yyyy", "d/M/yyyy", "yyyy-MM-dd"];
        return DateOnly.TryParseExact(dateStr, formats, null, System.Globalization.DateTimeStyles.None, out result);
    }
}
