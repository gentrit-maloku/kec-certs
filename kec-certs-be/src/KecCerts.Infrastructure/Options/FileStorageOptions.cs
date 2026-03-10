namespace KecCerts.Infrastructure.Options;

public sealed class FileStorageOptions
{
    public const string SectionName = "FileStorage";

    public string BasePath { get; init; } = "storage";
}
