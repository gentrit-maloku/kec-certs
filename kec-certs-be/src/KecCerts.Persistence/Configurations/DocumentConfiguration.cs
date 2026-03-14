using KecCerts.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KecCerts.Persistence.Configurations;

public class DocumentConfiguration : IEntityTypeConfiguration<Document>
{
    public void Configure(EntityTypeBuilder<Document> builder)
    {
        builder.ToTable("documents");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.Name).HasMaxLength(300).IsRequired();
        builder.Property(d => d.FileKey).HasMaxLength(500).IsRequired();
        builder.Property(d => d.FileName).HasMaxLength(500).IsRequired();
        builder.Property(d => d.ContentType).HasMaxLength(100).IsRequired();
        builder.Property(d => d.Category).HasMaxLength(50).IsRequired();
        builder.Property(d => d.Description).HasMaxLength(1000);

        builder.HasIndex(d => d.Category);
    }
}
