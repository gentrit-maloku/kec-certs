using KecCerts.Application.Common.Interfaces;
using KecCerts.Application.Common.Models;
using KecCerts.Domain.Entities;
using KecCerts.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KecCerts.Application.Certificates.Commands.ImportCertificates;

public class ImportCertificatesCommandHandler(
    IApplicationDbContext dbContext,
    ICurrentUserService currentUser,
    IExcelParser excelParser,
    ICertificateGenerator certificateGenerator,
    IFileStorageService fileStorage)
    : IRequestHandler<ImportCertificatesCommand, ImportCertificatesResult>
{
    public async Task<ImportCertificatesResult> Handle(
        ImportCertificatesCommand request, CancellationToken cancellationToken)
    {
        var parseResult = await excelParser.ParseCertificateDataAsync(request.FileStream, cancellationToken);

        var errors = new List<ImportError>(parseResult.Errors);
        var warnings = new List<ImportError>(parseResult.Warnings);

        if (errors.Count > 0 && !request.ContinueOnErrors)
        {
            return new ImportCertificatesResult(
                null, parseResult.Rows.Count, 0, errors.Count, warnings.Count,
                errors, warnings, await GetNextSerialNumber(cancellationToken));
        }

        // Get only the names+codes from rows we're importing to check duplicates efficiently
        var importNames = parseResult.Rows.Select(r => r.ParticipantFullName.ToLower()).Distinct().ToList();
        var importCodes = parseResult.Rows.Select(r => r.TrainingCode.ToLower()).Distinct().ToList();

        var existingCerts = await dbContext.Certificates
            .Where(c => importNames.Contains(c.ParticipantFullName.ToLower()) &&
                         importCodes.Contains(c.TrainingCode.ToLower()))
            .Select(c => new { c.ParticipantFullName, c.TrainingCode, c.TrainingGroup })
            .ToListAsync(cancellationToken);

        var existingLookup = existingCerts
            .Select(c => $"{c.ParticipantFullName?.ToLower()}|{c.TrainingCode?.ToLower()}|{c.TrainingGroup?.ToLower()}")
            .ToHashSet();

        var importedInThisBatch = new HashSet<string>();
        var nextSerial = await GetNextSerialNumber(cancellationToken);

        var batch = new BulkGenerationBatch
        {
            Id = Guid.NewGuid(),
            FileName = request.FileName,
            TotalCount = parseResult.Rows.Count,
            CreatedByUserId = currentUser.UserId
        };

        // Load programs with their active templates
        var trainingCodes = parseResult.Rows.Select(r => r.TrainingCode).Distinct().ToList();
        var programLookup = await dbContext.TrainingPrograms
            .Include(p => p.ActiveTemplate)
            .Where(p => trainingCodes.Contains(p.Code))
            .ToDictionaryAsync(p => p.Code, p => p, cancellationToken);

        var successCount = 0;
        var rowErrors = new List<ImportError>();

        foreach (var row in parseResult.Rows)
        {
            if (errors.Any(e => e.Row == row.RowNumber))
                continue;

            var duplicateKey = $"{row.ParticipantFullName.ToLower()}|{row.TrainingCode.ToLower()}|{row.TrainingGroup?.ToLower()}";

            if (existingLookup.Contains(duplicateKey))
            {
                warnings.Add(new ImportError(row.RowNumber, "Duplikim",
                    $"'{row.ParticipantFullName}' është tashmë i/e certifikuar për programin '{row.TrainingCode}'" +
                    (row.TrainingGroup != null ? $" (grupi: {row.TrainingGroup})" : "") +
                    ". Certifikata nuk u importua."));
                continue;
            }

            if (importedInThisBatch.Contains(duplicateKey))
            {
                warnings.Add(new ImportError(row.RowNumber, "Duplikim",
                    $"'{row.ParticipantFullName}' është përsëritur për programin '{row.TrainingCode}'" +
                    (row.TrainingGroup != null ? $" (grupi: {row.TrainingGroup})" : "") +
                    " brenda këtij skedari. Certifikata nuk u importua."));
                continue;
            }

            try
            {
                var serialNumber = nextSerial.ToString();
                nextSerial++;

                programLookup.TryGetValue(row.TrainingCode, out var program);
                var template = program?.ActiveTemplate;

                // If program has an active template ID but template wasn't loaded, fetch it
                if (template == null && program?.ActiveTemplateId != null)
                {
                    template = await dbContext.CertificateTemplates
                        .FirstOrDefaultAsync(t => t.Id == program.ActiveTemplateId, cancellationToken);
                }

                // Generate PDF certificate
                string? fileKey = null;
                try
                {
                    var genData = new CertificateGenerationData
                    {
                        SerialNumber = serialNumber,
                        IssueDate = row.IssueDate.ToString("dd.MM.yyyy"),
                        TrainingCode = row.TrainingCode,
                        TrainingName = row.TrainingName,
                        ParticipantFullName = row.ParticipantFullName,
                        CertificationType = template?.CertificationType,
                        Location = template?.Location ?? "Prishtinë",
                        Logo1FileKey = template?.Logo1FileKey,
                        Logo2FileKey = template?.Logo2FileKey,
                        Logo3FileKey = template?.Logo3FileKey,
                        Signature1FileKey = template?.Signature1FileKey,
                        Signature1Name = template?.Signature1Name,
                        Signature2FileKey = template?.Signature2FileKey,
                        Signature2Name = template?.Signature2Name,
                        Signature3FileKey = template?.Signature3FileKey,
                        Signature3Name = template?.Signature3Name,
                    };

                    var pdfBytes = await certificateGenerator.GenerateFromTemplateAsync(genData, cancellationToken);
                    var fileName = $"{serialNumber}_{row.ParticipantFullName.Replace(" ", "_")}.pdf";
                    fileKey = await fileStorage.SaveFileAsync(
                        pdfBytes, $"certificates/{row.TrainingCode}", fileName, cancellationToken);
                }
                catch (Exception ex)
                {
                    // PDF generation failed - log full error and add warning
                    var fullError = ex.ToString();
                    System.Console.Error.WriteLine($"[PDF ERROR] Row {row.RowNumber}: {fullError}");
                    warnings.Add(new ImportError(row.RowNumber, "PDF",
                        $"PDF nuk u gjenerua: {ex.Message} | {ex.InnerException?.Message}"));
                }

                var certificate = Certificate.Create(
                    serialNumber, row.IssueDate, row.TrainingCode, row.TrainingName,
                    row.ParticipantFullName, row.PersonalNumber, row.TrainingGroup,
                    row.Gender, row.Position, row.Subject, row.InstitutionName,
                    row.InstitutionLocation, row.Municipality, row.InstitutionType,
                    row.TrainingDates, program?.Id, template?.Id,
                    GenerationMethod.Bulk, currentUser.UserId, batch.Id);

                certificate.FileKey = fileKey;
                dbContext.Certificates.Add(certificate);
                importedInThisBatch.Add(duplicateKey);
                successCount++;
            }
            catch (Exception ex)
            {
                rowErrors.Add(new ImportError(row.RowNumber, "General", ex.Message));
            }
        }

        errors.AddRange(rowErrors);

        batch.SuccessCount = successCount;
        batch.ErrorCount = errors.Count;
        batch.Status = errors.Count == 0 && warnings.All(w => w.Field != "Duplikim")
            ? BatchStatus.Completed
            : successCount > 0
                ? BatchStatus.CompletedWithErrors
                : BatchStatus.Failed;
        batch.ErrorDetails = errors.Count > 0
            ? string.Join(Environment.NewLine, errors.Select(e => $"Row {e.Row} [{e.Field}]: {e.Message}"))
            : null;

        dbContext.BulkGenerationBatches.Add(batch);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new ImportCertificatesResult(
            batch.Id, parseResult.Rows.Count, successCount,
            errors.Count, warnings.Count, errors, warnings, nextSerial);
    }

    private async Task<int> GetNextSerialNumber(CancellationToken cancellationToken)
    {
        // Efficient: get count and max in DB, not in memory
        var count = await dbContext.Certificates.CountAsync(cancellationToken);
        if (count == 0) return 1;

        // Order by length then value to get the highest numeric serial
        var maxSerial = await dbContext.Certificates
            .OrderByDescending(c => c.SerialNumber.Length)
            .ThenByDescending(c => c.SerialNumber)
            .Select(c => c.SerialNumber)
            .FirstOrDefaultAsync(cancellationToken);

        if (maxSerial != null && int.TryParse(maxSerial, out var maxNum))
            return maxNum + 1;

        return 1;
    }
}
