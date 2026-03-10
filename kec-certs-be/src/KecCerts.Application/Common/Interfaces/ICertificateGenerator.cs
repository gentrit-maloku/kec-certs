namespace KecCerts.Application.Common.Interfaces;

public interface ICertificateGenerator
{
    /// <summary>
    /// Generates a PDF certificate from a template file and placeholder values.
    /// Returns the generated PDF as a byte array.
    /// </summary>
    Task<byte[]> GenerateAsync(
        string templateFileKey,
        Dictionary<string, string> placeholderValues,
        CancellationToken cancellationToken = default);
}
