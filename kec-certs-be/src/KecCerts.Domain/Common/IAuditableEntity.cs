namespace KecCerts.Domain.Common;

public interface IAuditableEntity
{
    Guid CreatedByUserId { get; set; }
    Guid? UpdatedByUserId { get; set; }
}
