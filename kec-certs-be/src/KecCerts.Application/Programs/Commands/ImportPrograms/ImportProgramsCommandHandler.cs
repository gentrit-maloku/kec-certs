using KecCerts.Application.Common.Interfaces;
using KecCerts.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace KecCerts.Application.Programs.Commands.ImportPrograms;

public sealed class ImportProgramsCommandHandler(
    IExcelParser excelParser,
    IApplicationDbContext dbContext,
    ICurrentUserService currentUser) : IRequestHandler<ImportProgramsCommand, ImportProgramsResult>
{
    public async Task<ImportProgramsResult> Handle(ImportProgramsCommand request, CancellationToken cancellationToken)
    {
        var parseResult = await excelParser.ParseProgramDataAsync(request.FileStream, cancellationToken);

        if (parseResult.Errors.Count > 0)
        {
            var errors = parseResult.Errors
                .Select(e => e.Row > 0 ? $"Rreshti {e.Row} ({e.Field}): {e.Message}" : e.Message)
                .ToList();
            return new ImportProgramsResult(0, 0, 0, errors);
        }

        if (parseResult.Rows.Count == 0)
            return new ImportProgramsResult(0, 0, 0, ["Excel nuk ka rreshta me të dhëna."]);

        // Load existing programs by code for upsert
        var codes = parseResult.Rows.Select(r => r.Code).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var existing = await dbContext.TrainingPrograms
            .Where(p => codes.Contains(p.Code))
            .ToDictionaryAsync(p => p.Code, StringComparer.OrdinalIgnoreCase, cancellationToken);

        int created = 0, updated = 0, skipped = 0;
        var resultErrors = new List<string>();

        foreach (var row in parseResult.Rows)
        {
            if (existing.TryGetValue(row.Code, out var program))
            {
                // Update existing
                program.Name = row.Name;
                program.NumberOfHours = row.NumberOfHours;
                program.RegistrationDate = row.RegistrationDate;
                program.Status = row.Status;
                program.AccreditationFrom = row.AccreditationFrom;
                program.AccreditationTo = row.AccreditationTo;
                updated++;
            }
            else
            {
                // Create new
                var newProgram = new TrainingProgram
                {
                    Id = Guid.NewGuid(),
                    Code = row.Code,
                    Name = row.Name,
                    NumberOfHours = row.NumberOfHours,
                    RegistrationDate = row.RegistrationDate,
                    Status = row.Status,
                    AccreditationFrom = row.AccreditationFrom,
                    AccreditationTo = row.AccreditationTo,
                    IsActive = true,
                    CreatedByUserId = currentUser.UserId
                };
                dbContext.TrainingPrograms.Add(newProgram);
                existing[row.Code] = newProgram;
                created++;
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return new ImportProgramsResult(created, updated, skipped, resultErrors);
    }
}
