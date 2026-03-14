using KecCerts.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KecCerts.Persistence.Configurations;

public class CertificateConfiguration : IEntityTypeConfiguration<Certificate>
{
    public void Configure(EntityTypeBuilder<Certificate> builder)
    {
        builder.ToTable("certificates");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.SerialNumber)
            .HasMaxLength(100)
            .IsRequired();
        builder.HasIndex(c => c.SerialNumber).IsUnique();

        builder.Property(c => c.IssueDate).IsRequired();
        builder.HasIndex(c => c.IssueDate);

        builder.Property(c => c.TrainingCode)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(c => c.TrainingName)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(c => c.ParticipantFullName)
            .HasMaxLength(200)
            .IsRequired();
        builder.HasIndex(c => c.ParticipantFullName);

        builder.Property(c => c.PersonalNumber).HasMaxLength(50);
        builder.Property(c => c.TrainingGroup).HasMaxLength(200);
        builder.Property(c => c.Gender).HasMaxLength(20);
        builder.Property(c => c.Position).HasMaxLength(200);
        builder.Property(c => c.Subject).HasMaxLength(300);
        builder.Property(c => c.InstitutionName).HasMaxLength(300);
        builder.Property(c => c.InstitutionLocation).HasMaxLength(200);
        builder.Property(c => c.Municipality).HasMaxLength(100);
        builder.Property(c => c.InstitutionType).HasMaxLength(100);
        builder.Property(c => c.TrainingDates).HasMaxLength(200);

        builder.Property(c => c.FileKey).HasMaxLength(500);

        builder.Property(c => c.GenerationMethod)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasIndex(c => c.TrainingProgramId);

        builder.HasOne(c => c.Batch)
            .WithMany(b => b.Certificates)
            .HasForeignKey(c => c.BatchId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(c => c.TrainingProgram)
            .WithMany(p => p.Certificates)
            .HasForeignKey(c => c.TrainingProgramId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(c => c.Template)
            .WithMany()
            .HasForeignKey(c => c.TemplateId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
