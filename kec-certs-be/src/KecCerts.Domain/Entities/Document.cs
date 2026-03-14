using KecCerts.Domain.Common;

namespace KecCerts.Domain.Entities;

public class Document : BaseEntity, IAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string FileKey { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string Category { get; set; } = string.Empty; // "certificate", "decision", "other"
    public string? Description { get; set; }

    public Guid CreatedByUserId { get; set; }
    public Guid? UpdatedByUserId { get; set; }
}
