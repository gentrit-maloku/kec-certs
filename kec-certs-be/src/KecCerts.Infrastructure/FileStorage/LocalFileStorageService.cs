using System.IO.Compression;
using KecCerts.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;

namespace KecCerts.Infrastructure.FileStorage;

public class LocalFileStorageService(IConfiguration configuration) : IFileStorageService
{
    private readonly string _basePath = configuration["FileStorage:BasePath"]
        ?? Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "storage");

    public async Task<string> SaveFileAsync(byte[] content, string folder, string fileName, CancellationToken cancellationToken = default)
    {
        var directoryPath = Path.Combine(_basePath, folder);
        Directory.CreateDirectory(directoryPath);

        var uniqueFileName = $"{Guid.NewGuid():N}_{fileName}";
        var filePath = Path.Combine(directoryPath, uniqueFileName);

        await File.WriteAllBytesAsync(filePath, content, cancellationToken);

        return Path.Combine(folder, uniqueFileName).Replace('\\', '/');
    }

    public async Task<byte[]> GetFileAsync(string fileKey, CancellationToken cancellationToken = default)
    {
        var filePath = Path.Combine(_basePath, fileKey);

        if (!File.Exists(filePath))
            throw new FileNotFoundException($"File not found: {fileKey}");

        return await File.ReadAllBytesAsync(filePath, cancellationToken);
    }

    public Task DeleteFileAsync(string fileKey, CancellationToken cancellationToken = default)
    {
        var filePath = Path.Combine(_basePath, fileKey);

        if (File.Exists(filePath))
            File.Delete(filePath);

        return Task.CompletedTask;
    }

    public async Task<string> SaveZipAsync(Dictionary<string, byte[]> files, string folder, string zipName, CancellationToken cancellationToken = default)
    {
        using var memoryStream = new MemoryStream();
        using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach (var (fileName, content) in files)
            {
                var entry = archive.CreateEntry(fileName, CompressionLevel.Optimal);
                await using var entryStream = entry.Open();
                await entryStream.WriteAsync(content, cancellationToken);
            }
        }

        memoryStream.Position = 0;
        return await SaveFileAsync(memoryStream.ToArray(), folder, zipName, cancellationToken);
    }
}
