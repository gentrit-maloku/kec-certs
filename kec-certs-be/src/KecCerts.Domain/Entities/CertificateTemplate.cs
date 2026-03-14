using KecCerts.Domain.Common;

namespace KecCerts.Domain.Entities;

public class CertificateTemplate : BaseEntity, IAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string TemplateFileKey { get; set; } = string.Empty;
    public string? Description { get; set; }

    // Certification type (e.g., "Certifikatë Pjesëmarrjeje", "Certifikatë Trajnimi")
    public string? CertificationType { get; set; }

    // Up to 3 logos (file keys)
    public string? Logo1FileKey { get; set; }
    public string? Logo2FileKey { get; set; }
    public string? Logo3FileKey { get; set; }

    // Up to 3 signatures (file keys + signer names)
    public string? Signature1FileKey { get; set; }
    public string? Signature1Name { get; set; }
    public string? Signature2FileKey { get; set; }
    public string? Signature2Name { get; set; }
    public string? Signature3FileKey { get; set; }
    public string? Signature3Name { get; set; }

    // Location for certificate (default: Prishtinë)
    public string Location { get; set; } = "Prishtinë";

    /// <summary>
    /// JSON array of placeholder names supported by this template.
    /// </summary>
    public string PlaceholdersJson { get; set; } = "[]";

    public Guid? TrainingProgramId { get; set; }
    public TrainingProgram? TrainingProgram { get; set; }

    public bool IsActive { get; set; } = true;

    public Guid CreatedByUserId { get; set; }
    public Guid? UpdatedByUserId { get; set; }

    public ICollection<Certificate> Certificates { get; set; } = [];
}
