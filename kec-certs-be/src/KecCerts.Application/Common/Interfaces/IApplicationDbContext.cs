using KecCerts.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace KecCerts.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<TrainingProgram> TrainingPrograms { get; }
    DbSet<CertificateTemplate> CertificateTemplates { get; }
    DbSet<Certificate> Certificates { get; }
    DbSet<BulkGenerationBatch> BulkGenerationBatches { get; }
    DbSet<Decision> Decisions { get; }
    DbSet<Document> Documents { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
