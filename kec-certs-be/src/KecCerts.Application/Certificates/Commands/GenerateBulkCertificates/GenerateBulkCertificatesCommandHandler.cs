using KecCerts.Application.Common.Interfaces;
using KecCerts.Domain.Entities;
using KecCerts.Domain.Enums;
using KecCerts.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KecCerts.Application.Certificates.Commands.GenerateBulkCertificates;

public class GenerateBulkCertificatesCommandHandler(
    IApplicationDbContext dbContext,
    ICurrentUserService currentUser,
    ICertificateGenerator certificateGenerator,
    IFileStorageService fileStorage,
    IExcelParser excelParser)
    : IRequestHandler<GenerateBulkCertificatesCommand, BulkGenerationResult>
{
    public async Task<BulkGenerationResult> Handle(
        GenerateBulkCertificatesCommand request, CancellationToken cancellationToken)
    {
        // Load program with active template
        var program = await dbContext.TrainingPrograms
            .Include(p => p.ActiveTemplate)
            .FirstOrDefaultAsync(p => p.Id == request.TrainingProgramId, cancellationToken)
            ?? throw new NotFoundException(nameof(TrainingProgram), request.TrainingProgramId);

        if (program.ActiveTemplate is null)
            throw new DomainException($"Training program '{program.Name}' has no active template assigned.");

        // Parse Excel
        var parseResult = await excelParser.ParseCertificateDataAsync(request.FileStream, cancellationToken);

        // Create batch record
        var batch = new BulkGenerationBatch
        {
            Id = Guid.NewGuid(),
            FileName = request.FileName,
            TotalCount = parseResult.Rows.Count,
            TrainingProgramId = program.Id,
            CreatedByUserId = currentUser.UserId
        };

        if (!parseResult.IsValid)
        {
            batch.Status = BatchStatus.Failed;
            batch.ErrorCount = parseResult.Errors.Count;
            batch.ErrorDetails = string.Join(Environment.NewLine, parseResult.Errors);
            dbContext.BulkGenerationBatches.Add(batch);
            await dbContext.SaveChangesAsync(cancellationToken);

            return new BulkGenerationResult(batch.Id, 0, 0, parseResult.Errors.Count, parseResult.Errors, null);
        }

        // Check for duplicate serial numbers in database
        var serialNumbers = parseResult.Rows.Select(r => r.SerialNumber).ToList();
        var existingSerials = await dbContext.Certificates
            .Where(c => serialNumbers.Contains(c.SerialNumber))
            .Select(c => c.SerialNumber)
            .ToListAsync(cancellationToken);

        var errors = new List<string>();
        var generatedFiles = new Dictionary<string, byte[]>();
        var successCount = 0;

        foreach (var row in parseResult.Rows)
        {
            if (existingSerials.Contains(row.SerialNumber))
            {
                errors.Add($"Row {row.RowNumber}: Serial number '{row.SerialNumber}' already exists.");
                continue;
            }

            try
            {
                var placeholders = new Dictionary<string, string>
                {
                    ["Emri"] = row.FirstName,
                    ["Mbiemri"] = row.LastName,
                    ["Programi"] = program.Name,
                    ["Data"] = row.IssueDate.ToString("dd.MM.yyyy"),
                    ["NumriSerial"] = row.SerialNumber,
                    ["Nota"] = row.Grade ?? string.Empty
                };

                var pdfBytes = await certificateGenerator.GenerateAsync(
                    program.ActiveTemplate.TemplateFileKey, placeholders, cancellationToken);

                var fileName = $"{row.SerialNumber}_{row.LastName}_{row.FirstName}.pdf";
                var fileKey = await fileStorage.SaveFileAsync(
                    pdfBytes, $"certificates/{program.Code}", fileName, cancellationToken);

                var certificate = Certificate.Create(
                    row.SerialNumber, row.FirstName, row.LastName,
                    row.PersonalNumber, row.IssueDate, row.Grade,
                    program.Id, program.ActiveTemplate.Id,
                    GenerationMethod.Bulk, currentUser.UserId, batch.Id);

                certificate.FileKey = fileKey;
                dbContext.Certificates.Add(certificate);
                generatedFiles[fileName] = pdfBytes;
                successCount++;
            }
            catch (Exception ex)
            {
                errors.Add($"Row {row.RowNumber}: {ex.Message}");
            }
        }

        // Create ZIP if any certificates were generated
        string? zipFileKey = null;
        if (generatedFiles.Count > 0)
        {
            zipFileKey = await fileStorage.SaveZipAsync(
                generatedFiles, $"batches/{program.Code}", $"batch_{batch.Id}.zip", cancellationToken);
        }

        batch.SuccessCount = successCount;
        batch.ErrorCount = errors.Count;
        batch.ZipFileKey = zipFileKey;
        batch.Status = errors.Count == 0 ? BatchStatus.Completed : BatchStatus.CompletedWithErrors;
        batch.ErrorDetails = errors.Count > 0 ? string.Join(Environment.NewLine, errors) : null;

        dbContext.BulkGenerationBatches.Add(batch);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new BulkGenerationResult(batch.Id, parseResult.Rows.Count, successCount, errors.Count, errors, zipFileKey);
    }
}
