namespace KecCerts.Application.Common.Interfaces;

public interface ICertificateGenerator
{
    Task<byte[]> GenerateAsync(
        string templateFileKey,
        Dictionary<string, string> placeholderValues,
        CancellationToken cancellationToken = default);

    Task<byte[]> GenerateFromTemplateAsync(
        CertificateGenerationData data,
        CancellationToken cancellationToken = default);

    Task<byte[]> GenerateBulkPdfAsync(
        IList<CertificateGenerationData> certificates,
        CancellationToken cancellationToken = default);
}

public class CertificateGenerationData
{
    public string SerialNumber { get; set; } = "";
    public string IssueDate { get; set; } = "";
    public string TrainingCode { get; set; } = "";
    public string TrainingName { get; set; } = "";
    public string ParticipantFullName { get; set; } = "";
    public string? CertificationType { get; set; }
    public string Location { get; set; } = "Prishtinë";

    // Logo file keys (up to 3)
    public string? Logo1FileKey { get; set; }
    public string? Logo2FileKey { get; set; }
    public string? Logo3FileKey { get; set; }

    // Signature file keys + names (up to 3)
    public string? Signature1FileKey { get; set; }
    public string? Signature1Name { get; set; }
    public string? Signature2FileKey { get; set; }
    public string? Signature2Name { get; set; }
    public string? Signature3FileKey { get; set; }
    public string? Signature3Name { get; set; }
}
