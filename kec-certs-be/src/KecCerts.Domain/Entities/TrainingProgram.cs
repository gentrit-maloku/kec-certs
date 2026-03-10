using KecCerts.Domain.Common;

namespace KecCerts.Domain.Entities;

public class TrainingProgram : BaseEntity, IAuditableEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    public Guid? ActiveTemplateId { get; set; }
    public CertificateTemplate? ActiveTemplate { get; set; }

    public Guid CreatedByUserId { get; set; }
    public Guid? UpdatedByUserId { get; set; }

    public ICollection<Certificate> Certificates { get; set; } = [];
    public ICollection<CertificateTemplate> Templates { get; set; } = [];
    public ICollection<Decision> Decisions { get; set; } = [];
}
