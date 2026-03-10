using KecCerts.Domain.Common;

namespace KecCerts.Domain.Entities;

public class Decision : BaseEntity, IAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string FileKey { get; set; } = string.Empty;
    public string? Description { get; set; }

    public Guid TrainingProgramId { get; set; }
    public TrainingProgram TrainingProgram { get; set; } = null!;

    public Guid CreatedByUserId { get; set; }
    public Guid? UpdatedByUserId { get; set; }
}
