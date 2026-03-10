using KecCerts.Domain.Common;

namespace KecCerts.Domain.Events;

public sealed class CertificateGeneratedEvent(Guid certificateId, string serialNumber) : DomainEvent
{
    public Guid CertificateId { get; } = certificateId;
    public string SerialNumber { get; } = serialNumber;
}
