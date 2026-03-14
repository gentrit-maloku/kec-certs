using KecCerts.Application.Common.Interfaces;
using KecCerts.Domain.Entities;
using KecCerts.Domain.Enums;
using KecCerts.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KecCerts.Application.Certificates.Commands.GenerateBulkCertificates;

// This handler is kept for backwards compatibility but ImportCertificatesCommand is the new way
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
        var program = await dbContext.TrainingPrograms
            .Include(p => p.ActiveTemplate)
            .FirstOrDefaultAsync(p => p.Id == request.TrainingProgramId, cancellationToken)
            ?? throw new NotFoundException(nameof(TrainingProgram), request.TrainingProgramId);

        if (program.ActiveTemplate is null)
            throw new DomainException($"Training program '{program.Name}' has no active template assigned.");

        var parseResult = await excelParser.ParseCertificateDataAsync(request.FileStream, cancellationToken);

        var batch = new BulkGenerationBatch
        {
            Id = Guid.NewGuid(),
            FileName = request.FileName,
            TotalCount = parseResult.Rows.Count,
            TrainingProgramId = program.Id,
            CreatedByUserId = currentUser.UserId
        };

        if (parseResult.Errors.Count > 0)
        {
            batch.Status = BatchStatus.Failed;
            batch.ErrorCount = parseResult.Errors.Count;
            batch.ErrorDetails = string.Join(Environment.NewLine,
                parseResult.Errors.Select(e => $"Row {e.Row} [{e.Field}]: {e.Message}"));
            dbContext.BulkGenerationBatches.Add(batch);
            await dbContext.SaveChangesAsync(cancellationToken);

            return new BulkGenerationResult(batch.Id, 0, 0, parseResult.Errors.Count,
                parseResult.Errors.Select(e => $"Row {e.Row} [{e.Field}]: {e.Message}").ToList(), null);
        }

        // Get next serial number
        var allSerials = await dbContext.Certificates
            .Select(c => c.SerialNumber)
            .ToListAsync(cancellationToken);
        var nextSerial = allSerials
            .Select(s => int.TryParse(s, out var n) ? n : 0)
            .DefaultIfEmpty(35000)
            .Max() + 1;

        var errors = new List<string>();
        var successCount = 0;

        foreach (var row in parseResult.Rows)
        {
            try
            {
                var serialNumber = nextSerial.ToString();
                nextSerial++;

                var certificate = Certificate.Create(
                    serialNumber,
                    row.IssueDate,
                    row.TrainingCode,
                    row.TrainingName,
                    row.ParticipantFullName,
                    row.PersonalNumber,
                    row.TrainingGroup,
                    row.Gender,
                    row.Position,
                    row.Subject,
                    row.InstitutionName,
                    row.InstitutionLocation,
                    row.Municipality,
                    row.InstitutionType,
                    row.TrainingDates,
                    program.Id,
                    program.ActiveTemplate.Id,
                    GenerationMethod.Bulk,
                    currentUser.UserId,
                    batch.Id);

                dbContext.Certificates.Add(certificate);
                successCount++;
            }
            catch (Exception ex)
            {
                errors.Add($"Row {row.RowNumber}: {ex.Message}");
            }
        }

        batch.SuccessCount = successCount;
        batch.ErrorCount = errors.Count;
        batch.Status = errors.Count == 0 ? BatchStatus.Completed : BatchStatus.CompletedWithErrors;
        batch.ErrorDetails = errors.Count > 0 ? string.Join(Environment.NewLine, errors) : null;

        dbContext.BulkGenerationBatches.Add(batch);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new BulkGenerationResult(batch.Id, parseResult.Rows.Count, successCount, errors.Count, errors, null);
    }
}
