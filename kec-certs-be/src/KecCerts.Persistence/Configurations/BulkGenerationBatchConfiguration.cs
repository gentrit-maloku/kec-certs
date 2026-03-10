using KecCerts.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KecCerts.Persistence.Configurations;

public class BulkGenerationBatchConfiguration : IEntityTypeConfiguration<BulkGenerationBatch>
{
    public void Configure(EntityTypeBuilder<BulkGenerationBatch> builder)
    {
        builder.ToTable("bulk_generation_batches");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.FileName)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(b => b.Status)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(b => b.ZipFileKey)
            .HasMaxLength(500);

        builder.Property(b => b.ErrorDetails)
            .HasColumnType("text");
    }
}
