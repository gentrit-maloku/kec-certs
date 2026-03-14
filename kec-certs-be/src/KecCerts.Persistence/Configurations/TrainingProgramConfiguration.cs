using KecCerts.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KecCerts.Persistence.Configurations;

public class TrainingProgramConfiguration : IEntityTypeConfiguration<TrainingProgram>
{
    public void Configure(EntityTypeBuilder<TrainingProgram> builder)
    {
        builder.ToTable("training_programs");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Code)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(p => p.Code).IsUnique();

        builder.Property(p => p.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(p => p.Description)
            .HasMaxLength(1000);

        builder.Property(p => p.Status).HasMaxLength(50);

        builder.Ignore(p => p.IsAccreditationExpired);
        builder.Ignore(p => p.IsAccreditationExpiringSoon);

        builder.HasOne(p => p.ActiveTemplate)
            .WithMany()
            .HasForeignKey(p => p.ActiveTemplateId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(p => p.Templates)
            .WithOne(t => t.TrainingProgram)
            .HasForeignKey(t => t.TrainingProgramId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(p => p.Certificates)
            .WithOne(c => c.TrainingProgram)
            .HasForeignKey(c => c.TrainingProgramId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(p => p.Decisions)
            .WithOne(d => d.TrainingProgram)
            .HasForeignKey(d => d.TrainingProgramId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
