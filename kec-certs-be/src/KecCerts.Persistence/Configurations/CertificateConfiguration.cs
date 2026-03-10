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

        builder.Property(c => c.ParticipantFirstName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(c => c.ParticipantLastName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(c => c.ParticipantPersonalNumber)
            .HasMaxLength(50);

        builder.Property(c => c.Grade)
            .HasMaxLength(50);

        builder.Property(c => c.FileKey)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(c => c.GenerationMethod)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasIndex(c => c.IssueDate);
        builder.HasIndex(c => c.ParticipantLastName);
        builder.HasIndex(c => c.TrainingProgramId);

        builder.HasOne(c => c.Batch)
            .WithMany(b => b.Certificates)
            .HasForeignKey(c => c.BatchId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
