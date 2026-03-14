using KecCerts.Domain.Common;
using KecCerts.Domain.Enums;

namespace KecCerts.Domain.Entities;

public class BulkGenerationBatch : BaseEntity, IAuditableEntity
{
    public string FileName { get; set; } = string.Empty;
    public int TotalCount { get; set; }
    public int SuccessCount { get; set; }
    public int ErrorCount { get; set; }
    public BatchStatus Status { get; set; } = BatchStatus.Processing;
    public string? ZipFileKey { get; set; }
    public string? ErrorDetails { get; set; }

    public Guid? TrainingProgramId { get; set; }
    public TrainingProgram? TrainingProgram { get; set; }

    public Guid CreatedByUserId { get; set; }
    public Guid? UpdatedByUserId { get; set; }

    public ICollection<Certificate> Certificates { get; set; } = [];
}
