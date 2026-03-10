using KecCerts.Domain.Common;

namespace KecCerts.Domain.Entities;

public class CertificateTemplate : BaseEntity, IAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string TemplateFileKey { get; set; } = string.Empty;
    public string? Description { get; set; }

    /// <summary>
    /// JSON array of placeholder names supported by this template.
    /// Example: ["Emri", "Mbiemri", "Programi", "Data", "Nota", "NumriSerial"]
    /// </summary>
    public string PlaceholdersJson { get; set; } = "[]";

    public Guid? TrainingProgramId { get; set; }
    public TrainingProgram? TrainingProgram { get; set; }

    public bool IsActive { get; set; } = true;

    public Guid CreatedByUserId { get; set; }
    public Guid? UpdatedByUserId { get; set; }

    public ICollection<Certificate> Certificates { get; set; } = [];
}
