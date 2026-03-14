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
            result.Errors.Add(new ImportError(0, "File", "Excel file contains no worksheets."));
            return Task.FromResult(result);
        }

        var rows = worksheet.RangeUsed()?.RowsUsed().Skip(1).ToList(); // Skip header row
        if (rows is null || rows.Count == 0)
        {
            result.Errors.Add(new ImportError(0, "File", "Excel file contains no data rows."));
            return Task.FromResult(result);
        }

        for (int i = 0; i < rows.Count; i++)
        {
            var row = rows[i];
            var rowNumber = i + 2; // 1-based, +1 for header

            // Skip completely empty rows
            var allEmpty = Enumerable.Range(1, 5).All(col => string.IsNullOrWhiteSpace(GetCellString(row, col)));
            if (allEmpty) continue;

            // Column A - Numri rendor (REQUIRED)
            var numriRendor = GetCellString(row, 1);
            // Column B - Data e lëshimit te certifikatës (REQUIRED)
            var issueDateStr = GetCellString(row, 2);
            // Column C - Kodi i trajnimit (REQUIRED)
            var trainingCode = GetCellString(row, 3);
            // Column D - Emri i trajnimit (REQUIRED)
            var trainingName = GetCellString(row, 4);
            // Column E - Emri dhe mbiemri (REQUIRED)
            var fullName = GetCellString(row, 5);
            // Column F - Numri personal
            var personalNumber = GetCellString(row, 6);
            // Column G - Grupi i trajnimit
            var trainingGroup = GetCellString(row, 7);
            // Column H - Gjinia
            var gender = GetCellString(row, 8);
            // Column I - Pozita
            var position = GetCellString(row, 9);
            // Column J - Lënda
            var subject = GetCellString(row, 10);
            // Column K - Emri i institucionit
            var institutionName = GetCellString(row, 11);
            // Column L - Vendi i institucionit
            var institutionLocation = GetCellString(row, 12);
            // Column M - Komuna
            var municipality = GetCellString(row, 13);
            // Column N - Tipi i institucionit
            var institutionType = GetCellString(row, 14);
            // Column O - Datat e mbajtjes se trajnimit
            var trainingDates = GetCellString(row, 15);

            // Validate required fields (A-E)
            var hasError = false;

            if (string.IsNullOrEmpty(numriRendor))
            {
                result.Errors.Add(new ImportError(rowNumber, "Numri rendor (A)", "Serial number is required."));
                hasError = true;
            }

            if (string.IsNullOrEmpty(issueDateStr))
            {
                result.Errors.Add(new ImportError(rowNumber, "Data e lëshimit (B)", "Issue date is required."));
                hasError = true;
            }

            if (string.IsNullOrEmpty(trainingCode))
            {
                result.Errors.Add(new ImportError(rowNumber, "Kodi i trajnimit (C)", "Training code is required."));
                hasError = true;
            }

            if (string.IsNullOrEmpty(trainingName))
            {
                result.Errors.Add(new ImportError(rowNumber, "Emri i trajnimit (D)", "Training name is required."));
                hasError = true;
            }

            if (string.IsNullOrEmpty(fullName))
            {
                result.Errors.Add(new ImportError(rowNumber, "Emri dhe mbiemri (E)", "Full name is required."));
                hasError = true;
            }

            // Parse date
            DateOnly issueDate = default;
            if (!string.IsNullOrEmpty(issueDateStr))
            {
                if (!TryParseDate(issueDateStr, row.Cell(2), out issueDate))
                {
                    result.Errors.Add(new ImportError(rowNumber, "Data e lëshimit (B)",
                        $"Invalid date format '{issueDateStr}'. Expected DD.MM.YYYY."));
                    hasError = true;
                }
            }

            if (hasError)
                continue;

            // Add optional field warnings
            if (string.IsNullOrEmpty(personalNumber))
                result.Warnings.Add(new ImportError(rowNumber, "Numri personal (F)", "Personal number is empty."));

            result.Rows.Add(new CertificateRow(
                rowNumber,
                issueDate,
                trainingCode!,
                trainingName!,
                fullName!,
                NullIfEmpty(personalNumber),
                NullIfEmpty(trainingGroup),
                NullIfEmpty(gender),
                NullIfEmpty(position),
                NullIfEmpty(subject),
                NullIfEmpty(institutionName),
                NullIfEmpty(institutionLocation),
                NullIfEmpty(municipality),
                NullIfEmpty(institutionType),
                NullIfEmpty(trainingDates)));
        }

        return Task.FromResult(result);
    }

    public Task<ProgramParseResult> ParseProgramDataAsync(Stream fileStream, CancellationToken cancellationToken = default)
    {
        var result = new ProgramParseResult();

        using var workbook = new XLWorkbook(fileStream);
        var worksheet = workbook.Worksheets.FirstOrDefault();

        if (worksheet is null)
        {
            result.Errors.Add(new ImportError(0, "File", "Excel file contains no worksheets."));
            return Task.FromResult(result);
        }

        var rows = worksheet.RangeUsed()?.RowsUsed().Skip(1).ToList();
        if (rows is null || rows.Count == 0)
        {
            result.Errors.Add(new ImportError(0, "File", "Excel file contains no data rows."));
            return Task.FromResult(result);
        }

        for (int i = 0; i < rows.Count; i++)
        {
            var row = rows[i];
            var rowNumber = i + 2;

            // Skip completely empty rows
            var allEmpty = Enumerable.Range(1, 5).All(col => string.IsNullOrWhiteSpace(GetCellString(row, col)));
            if (allEmpty) continue;

            var code = GetCellString(row, 1);       // A - Kodi
            var name = GetCellString(row, 2);       // B - Emërtimi
            var hoursStr = GetCellString(row, 3);   // C - Numri i orëve
            var regDateStr = GetCellString(row, 4); // D - Data e regjistrimit
            var status = GetCellString(row, 5);     // E - Statusi
            var accFromStr = GetCellString(row, 6); // F - Akreditimi prej
            var accToStr = GetCellString(row, 7);   // G - Akreditimi deri

            var hasError = false;

            if (string.IsNullOrEmpty(code))
            {
                result.Errors.Add(new ImportError(rowNumber, "Kodi (A)", "Kodi është i detyrueshëm."));
                hasError = true;
            }

            if (string.IsNullOrEmpty(name))
            {
                result.Errors.Add(new ImportError(rowNumber, "Emërtimi (B)", "Emërtimi është i detyrueshëm."));
                hasError = true;
            }

            if (hasError) continue;

            int? numberOfHours = null;
            if (!string.IsNullOrEmpty(hoursStr) && int.TryParse(hoursStr, out var h))
                numberOfHours = h;

            DateOnly? registrationDate = null;
            if (!string.IsNullOrEmpty(regDateStr))
            {
                if (TryParseDate(regDateStr, row.Cell(4), out var rd))
                    registrationDate = rd;
            }

            DateOnly? accFrom = null;
            if (!string.IsNullOrEmpty(accFromStr))
            {
                if (TryParseDate(accFromStr, row.Cell(6), out var af))
                    accFrom = af;
            }

            DateOnly? accTo = null;
            if (!string.IsNullOrEmpty(accToStr))
            {
                if (TryParseDate(accToStr, row.Cell(7), out var at))
                    accTo = at;
            }

            result.Rows.Add(new ProgramRow(
                rowNumber,
                code!,
                name!,
                numberOfHours,
                registrationDate,
                NullIfEmpty(status),
                accFrom,
                accTo));
        }

        return Task.FromResult(result);
    }

    private static string GetCellString(IXLRangeRow row, int column)
    {
        var cell = row.Cell(column);
        if (cell.DataType == XLDataType.DateTime)
            return cell.GetDateTime().ToString("dd.MM.yyyy");
        return cell.GetString().Trim();
    }

    private static string? NullIfEmpty(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value;

    private static bool TryParseDate(string dateStr, IXLCell cell, out DateOnly result)
    {
        result = default;

        if (cell.DataType == XLDataType.DateTime)
        {
            var dt = cell.GetDateTime();
            result = DateOnly.FromDateTime(dt);
            return true;
        }

        string[] formats = ["dd.MM.yyyy", "dd/MM/yyyy", "d.M.yyyy", "d/M/yyyy", "yyyy-MM-dd"];
        return DateOnly.TryParseExact(dateStr, formats, null, System.Globalization.DateTimeStyles.None, out result);
    }
}
