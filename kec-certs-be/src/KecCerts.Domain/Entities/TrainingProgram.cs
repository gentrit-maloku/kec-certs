using KecCerts.Domain.Common;

namespace KecCerts.Domain.Entities;

public class TrainingProgram : BaseEntity, IAuditableEntity
{
    // From Excel "Libri i programeve te trajnimit"
    public string Code { get; set; } = string.Empty;           // Kodi
    public string Name { get; set; } = string.Empty;           // Emërtimi
    public int? NumberOfHours { get; set; }                     // Numri i orëve
    public DateOnly? RegistrationDate { get; set; }            // Data e regjistrimit
    public string? Status { get; set; }                         // Statusi
    public DateOnly? AccreditationFrom { get; set; }           // Akreditimi periudha - nga
    public DateOnly? AccreditationTo { get; set; }             // Akreditimi periudha - deri

    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    public Guid? ActiveTemplateId { get; set; }
    public CertificateTemplate? ActiveTemplate { get; set; }

    public Guid CreatedByUserId { get; set; }
    public Guid? UpdatedByUserId { get; set; }

    public ICollection<Certificate> Certificates { get; set; } = [];
    public ICollection<CertificateTemplate> Templates { get; set; } = [];
    public ICollection<Decision> Decisions { get; set; } = [];

    public bool IsAccreditationExpired =>
        AccreditationTo.HasValue && AccreditationTo.Value < DateOnly.FromDateTime(DateTime.UtcNow);

    public bool IsAccreditationExpiringSoon =>
        AccreditationTo.HasValue &&
        !IsAccreditationExpired &&
        AccreditationTo.Value <= DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30));
}
