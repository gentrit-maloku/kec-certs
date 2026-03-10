using KecCerts.Domain.Common;
using KecCerts.Domain.Enums;
using KecCerts.Domain.Events;

namespace KecCerts.Domain.Entities;

public class Certificate : BaseEntity, IAuditableEntity
{
    public string SerialNumber { get; set; } = string.Empty;
    public string ParticipantFirstName { get; set; } = string.Empty;
    public string ParticipantLastName { get; set; } = string.Empty;
    public string? ParticipantPersonalNumber { get; set; }
    public DateOnly IssueDate { get; set; }
    public string? Grade { get; set; }
    public string FileKey { get; set; } = string.Empty;

    public GenerationMethod GenerationMethod { get; set; }
    public Guid? BatchId { get; set; }
    public BulkGenerationBatch? Batch { get; set; }

    public Guid TrainingProgramId { get; set; }
    public TrainingProgram TrainingProgram { get; set; } = null!;

    public Guid TemplateId { get; set; }
    public CertificateTemplate Template { get; set; } = null!;

    public Guid CreatedByUserId { get; set; }
    public Guid? UpdatedByUserId { get; set; }

    public static Certificate Create(
        string serialNumber,
        string firstName,
        string lastName,
        string? personalNumber,
        DateOnly issueDate,
        string? grade,
        Guid programId,
        Guid templateId,
        GenerationMethod method,
        Guid createdByUserId,
        Guid? batchId = null)
    {
        var certificate = new Certificate
        {
            Id = Guid.NewGuid(),
            SerialNumber = serialNumber,
            ParticipantFirstName = firstName,
            ParticipantLastName = lastName,
            ParticipantPersonalNumber = personalNumber,
            IssueDate = issueDate,
            Grade = grade,
            TrainingProgramId = programId,
            TemplateId = templateId,
            GenerationMethod = method,
            CreatedByUserId = createdByUserId,
            BatchId = batchId
        };

        certificate.AddDomainEvent(new CertificateGeneratedEvent(certificate.Id, serialNumber));

        return certificate;
    }
}
