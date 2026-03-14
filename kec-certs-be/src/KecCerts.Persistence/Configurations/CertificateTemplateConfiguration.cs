using KecCerts.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KecCerts.Persistence.Configurations;

public class CertificateTemplateConfiguration : IEntityTypeConfiguration<CertificateTemplate>
{
    public void Configure(EntityTypeBuilder<CertificateTemplate> builder)
    {
        builder.ToTable("certificate_templates");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Name).HasMaxLength(200).IsRequired();
        builder.Property(t => t.TemplateFileKey).HasMaxLength(500).IsRequired();
        builder.Property(t => t.Description).HasMaxLength(1000);
        builder.Property(t => t.CertificationType).HasMaxLength(200);
        builder.Property(t => t.Location).HasMaxLength(100).HasDefaultValue("Prishtinë");

        builder.Property(t => t.Logo1FileKey).HasMaxLength(500);
        builder.Property(t => t.Logo2FileKey).HasMaxLength(500);
        builder.Property(t => t.Logo3FileKey).HasMaxLength(500);

        builder.Property(t => t.Signature1FileKey).HasMaxLength(500);
        builder.Property(t => t.Signature1Name).HasMaxLength(200);
        builder.Property(t => t.Signature2FileKey).HasMaxLength(500);
        builder.Property(t => t.Signature2Name).HasMaxLength(200);
        builder.Property(t => t.Signature3FileKey).HasMaxLength(500);
        builder.Property(t => t.Signature3Name).HasMaxLength(200);

        builder.Property(t => t.PlaceholdersJson)
            .HasColumnType("jsonb")
            .HasDefaultValue("[]");

        builder.HasMany(t => t.Certificates)
            .WithOne(c => c.Template)
            .HasForeignKey(c => c.TemplateId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
