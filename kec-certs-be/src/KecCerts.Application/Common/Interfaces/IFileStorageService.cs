namespace KecCerts.Application.Common.Interfaces;

public interface IFileStorageService
{
    Task<string> SaveFileAsync(byte[] content, string folder, string fileName, CancellationToken cancellationToken = default);
    Task<byte[]> GetFileAsync(string fileKey, CancellationToken cancellationToken = default);
    Task DeleteFileAsync(string fileKey, CancellationToken cancellationToken = default);
    Task<string> SaveZipAsync(Dictionary<string, byte[]> files, string folder, string zipName, CancellationToken cancellationToken = default);
}
