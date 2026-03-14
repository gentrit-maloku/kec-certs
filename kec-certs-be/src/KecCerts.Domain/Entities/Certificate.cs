using KecCerts.Domain.Common;
using KecCerts.Domain.Enums;
using KecCerts.Domain.Events;

namespace KecCerts.Domain.Entities;

public class Certificate : BaseEntity, IAuditableEntity
{
    // Column A - Numri rendor (auto-generated sequential number)
    public string SerialNumber { get; set; } = string.Empty;

    // Column B - Data e lëshimit te certifikatës
    public DateOnly IssueDate { get; set; }

    // Column C - Kodi i trajnimit
    public string TrainingCode { get; set; } = string.Empty;

    // Column D - Emri i trajnimit
    public string TrainingName { get; set; } = string.Empty;

    // Column E - Emri dhe mbiemri
    public string ParticipantFullName { get; set; } = string.Empty;

    // Column F - Numri personal
    public string? PersonalNumber { get; set; }

    // Column G - Grupi i trajnimit
    public string? TrainingGroup { get; set; }

    // Column H - Gjinia
    public string? Gender { get; set; }

    // Column I - Pozita
    public string? Position { get; set; }

    // Column J - Lënda
    public string? Subject { get; set; }

    // Column K - Emri i institucionit
    public string? InstitutionName { get; set; }

    // Column L - Vendi i institucionit
    public string? InstitutionLocation { get; set; }

    // Column M - Komuna
    public string? Municipality { get; set; }

    // Column N - Tipi i institucionit
    public string? InstitutionType { get; set; }

    // Column O - Datat e mbajtjes se trajnimit (prej deri)
    public string? TrainingDates { get; set; }

    // File & generation
    public string? FileKey { get; set; }
    public GenerationMethod GenerationMethod { get; set; }

    // Relationships
    public Guid? BatchId { get; set; }
    public BulkGenerationBatch? Batch { get; set; }

    public Guid? TrainingProgramId { get; set; }
    public TrainingProgram? TrainingProgram { get; set; }

    public Guid? TemplateId { get; set; }
    public CertificateTemplate? Template { get; set; }

    // Audit
    public Guid CreatedByUserId { get; set; }
    public Guid? UpdatedByUserId { get; set; }

    public static Certificate Create(
        string serialNumber,
        DateOnly issueDate,
        string trainingCode,
        string trainingName,
        string participantFullName,
        string? personalNumber,
        string? trainingGroup,
        string? gender,
        string? position,
        string? subject,
        string? institutionName,
        string? institutionLocation,
        string? municipality,
        string? institutionType,
        string? trainingDates,
        Guid? programId,
        Guid? templateId,
        GenerationMethod method,
        Guid createdByUserId,
        Guid? batchId = null)
    {
        var certificate = new Certificate
        {
            Id = Guid.NewGuid(),
            SerialNumber = serialNumber,
            IssueDate = issueDate,
            TrainingCode = trainingCode,
            TrainingName = trainingName,
            ParticipantFullName = participantFullName,
            PersonalNumber = personalNumber,
            TrainingGroup = trainingGroup,
            Gender = gender,
            Position = position,
            Subject = subject,
            InstitutionName = institutionName,
            InstitutionLocation = institutionLocation,
            Municipality = municipality,
            InstitutionType = institutionType,
            TrainingDates = trainingDates,
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
