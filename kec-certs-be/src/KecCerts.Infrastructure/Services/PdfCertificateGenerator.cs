using KecCerts.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace KecCerts.Infrastructure.Services;

public class PdfCertificateGenerator(
    IFileStorageService fileStorage,
    ILogger<PdfCertificateGenerator> logger)
    : ICertificateGenerator
{
    public async Task<byte[]> GenerateAsync(
        string templateFileKey,
        Dictionary<string, string> placeholderValues,
        CancellationToken cancellationToken = default)
    {
        var data = new CertificateGenerationData
        {
            SerialNumber = placeholderValues.GetValueOrDefault("NumriRendor", ""),
            IssueDate = placeholderValues.GetValueOrDefault("Data", ""),
            TrainingCode = placeholderValues.GetValueOrDefault("KodiProgramit", ""),
            TrainingName = placeholderValues.GetValueOrDefault("EmriTrajnimit", ""),
            ParticipantFullName = placeholderValues.GetValueOrDefault("EmriDheMbiemri", ""),
            Location = "Prishtinë"
        };

        return await GenerateFromTemplateAsync(data, cancellationToken);
    }

    public async Task<byte[]> GenerateFromTemplateAsync(
        CertificateGenerationData data,
        CancellationToken cancellationToken = default)
    {
        logger.LogInformation("Generating PDF for {Name}, Serial: {Serial}",
            data.ParticipantFullName, data.SerialNumber);

        // Load images
        var logoImages = new List<byte[]>();
        foreach (var key in new[] { data.Logo1FileKey, data.Logo2FileKey, data.Logo3FileKey })
        {
            var img = await LoadImage(key, cancellationToken);
            if (img != null) logoImages.Add(img);
        }

        var sigData = new List<(byte[]? Image, string? Name)>();
        var sigKeys = new[] { data.Signature1FileKey, data.Signature2FileKey, data.Signature3FileKey };
        var sigNames = new[] { data.Signature1Name, data.Signature2Name, data.Signature3Name };
        for (int i = 0; i < 3; i++)
        {
            var img = await LoadImage(sigKeys[i], cancellationToken);
            if (img != null || !string.IsNullOrEmpty(sigNames[i]))
                sigData.Add((img, sigNames[i]));
        }

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(28.35f); // 1cm

                page.Content()
                    .Border(2)
                    .BorderColor(Colors.Blue.Darken2)
                    .Padding(25)
                    .Column(column =>
                {
                    column.Spacing(8);

                    // Logos
                    if (logoImages.Count > 0)
                    {
                        column.Item().Row(row =>
                        {
                            foreach (var logo in logoImages)
                            {
                                row.RelativeItem().AlignCenter().MaxHeight(60).Image(logo).FitHeight();
                            }
                        });
                        column.Item().PaddingTop(10);
                    }

                    // Certification type
                    var title = !string.IsNullOrEmpty(data.CertificationType)
                        ? data.CertificationType.ToUpper()
                        : "CERTIFIKATË";
                    column.Item().AlignCenter().Text(title).FontSize(28).Bold().FontColor(Colors.Blue.Darken3);

                    // Training code
                    column.Item().AlignCenter()
                        .Text($"Kodi i programit: {data.TrainingCode}")
                        .FontSize(10).FontColor(Colors.Grey.Darken1);

                    column.Item().PaddingTop(10);

                    // Certificate text
                    column.Item().AlignCenter().Text("Vërtetohet se").FontSize(13).FontColor(Colors.Grey.Darken2);

                    // Participant name
                    column.Item().AlignCenter()
                        .Text(data.ParticipantFullName)
                        .FontSize(24).Bold().FontColor(Colors.Blue.Darken4);

                    column.Item().AlignCenter()
                        .Text("ka përfunduar me sukses programin e trajnimit:")
                        .FontSize(13).FontColor(Colors.Grey.Darken2);

                    // Training name
                    column.Item().AlignCenter()
                        .Text(data.TrainingName)
                        .FontSize(18).Bold().Italic();

                    column.Item().PaddingTop(20);

                    // Location + Date
                    column.Item().AlignCenter()
                        .Text($"{data.Location}, {data.IssueDate}")
                        .FontSize(13);

                    // Serial number
                    column.Item().AlignCenter()
                        .Text($"Nr. {data.SerialNumber}")
                        .FontSize(11).FontColor(Colors.Grey.Darken1);

                    column.Item().PaddingTop(25);

                    // Signatures
                    if (sigData.Count > 0)
                    {
                        column.Item().Row(row =>
                        {
                            foreach (var (img, name) in sigData)
                            {
                                row.RelativeItem().Column(sigCol =>
                                {
                                    if (img != null)
                                        sigCol.Item().AlignCenter().MaxHeight(40).Image(img).FitHeight();

                                    sigCol.Item().AlignCenter()
                                        .Text("_______________________")
                                        .FontSize(8).FontColor(Colors.Grey.Medium);

                                    if (!string.IsNullOrEmpty(name))
                                        sigCol.Item().AlignCenter().Text(name).FontSize(9).Bold();
                                });
                            }
                        });
                    }
                });
            });
        });

        var result = document.GeneratePdf();
        logger.LogInformation("PDF generated: {Size} bytes", result.Length);
        return result;
    }

    public async Task<byte[]> GenerateBulkPdfAsync(
        IList<CertificateGenerationData> certificates,
        CancellationToken cancellationToken = default)
    {
        logger.LogInformation("Generating bulk PDF for {Count} certificates", certificates.Count);

        // Pre-load all images for each certificate before creating the QuestPDF document
        var certImageData = new List<(CertificateGenerationData Data, List<byte[]> Logos, List<(byte[]? Image, string? Name)> Signatures)>();

        foreach (var cert in certificates)
        {
            var logoImages = new List<byte[]>();
            foreach (var key in new[] { cert.Logo1FileKey, cert.Logo2FileKey, cert.Logo3FileKey })
            {
                var img = await LoadImage(key, cancellationToken);
                if (img != null) logoImages.Add(img);
            }

            var sigData = new List<(byte[]? Image, string? Name)>();
            var sigKeys = new[] { cert.Signature1FileKey, cert.Signature2FileKey, cert.Signature3FileKey };
            var sigNames = new[] { cert.Signature1Name, cert.Signature2Name, cert.Signature3Name };
            for (int i = 0; i < 3; i++)
            {
                var img = await LoadImage(sigKeys[i], cancellationToken);
                if (img != null || !string.IsNullOrEmpty(sigNames[i]))
                    sigData.Add((img, sigNames[i]));
            }

            certImageData.Add((cert, logoImages, sigData));
        }

        var document = Document.Create(container =>
        {
            foreach (var (data, logoImages, sigData) in certImageData)
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4.Landscape());
                    page.Margin(28.35f); // 1cm

                    page.Content()
                        .Border(2)
                        .BorderColor(Colors.Blue.Darken2)
                        .Padding(25)
                        .Column(column =>
                    {
                        column.Spacing(8);

                        // Logos
                        if (logoImages.Count > 0)
                        {
                            column.Item().Row(row =>
                            {
                                foreach (var logo in logoImages)
                                {
                                    row.RelativeItem().AlignCenter().MaxHeight(60).Image(logo).FitHeight();
                                }
                            });
                            column.Item().PaddingTop(10);
                        }

                        // Certification type
                        var title = !string.IsNullOrEmpty(data.CertificationType)
                            ? data.CertificationType.ToUpper()
                            : "CERTIFIKATË";
                        column.Item().AlignCenter().Text(title).FontSize(28).Bold().FontColor(Colors.Blue.Darken3);

                        // Training code
                        column.Item().AlignCenter()
                            .Text($"Kodi i programit: {data.TrainingCode}")
                            .FontSize(10).FontColor(Colors.Grey.Darken1);

                        column.Item().PaddingTop(10);

                        // Certificate text
                        column.Item().AlignCenter().Text("Vërtetohet se").FontSize(13).FontColor(Colors.Grey.Darken2);

                        // Participant name
                        column.Item().AlignCenter()
                            .Text(data.ParticipantFullName)
                            .FontSize(24).Bold().FontColor(Colors.Blue.Darken4);

                        column.Item().AlignCenter()
                            .Text("ka përfunduar me sukses programin e trajnimit:")
                            .FontSize(13).FontColor(Colors.Grey.Darken2);

                        // Training name
                        column.Item().AlignCenter()
                            .Text(data.TrainingName)
                            .FontSize(18).Bold().Italic();

                        column.Item().PaddingTop(20);

                        // Location + Date
                        column.Item().AlignCenter()
                            .Text($"{data.Location}, {data.IssueDate}")
                            .FontSize(13);

                        // Serial number
                        column.Item().AlignCenter()
                            .Text($"Nr. {data.SerialNumber}")
                            .FontSize(11).FontColor(Colors.Grey.Darken1);

                        column.Item().PaddingTop(25);

                        // Signatures
                        if (sigData.Count > 0)
                        {
                            column.Item().Row(row =>
                            {
                                foreach (var (img, name) in sigData)
                                {
                                    row.RelativeItem().Column(sigCol =>
                                    {
                                        if (img != null)
                                            sigCol.Item().AlignCenter().MaxHeight(40).Image(img).FitHeight();

                                        sigCol.Item().AlignCenter()
                                            .Text("_______________________")
                                            .FontSize(8).FontColor(Colors.Grey.Medium);

                                        if (!string.IsNullOrEmpty(name))
                                            sigCol.Item().AlignCenter().Text(name).FontSize(9).Bold();
                                    });
                                }
                            });
                        }
                    });
                });
            }
        });

        var result = document.GeneratePdf();
        logger.LogInformation("Bulk PDF generated: {Size} bytes for {Count} certificates", result.Length, certificates.Count);
        return result;
    }

    private async Task<byte[]?> LoadImage(string? fileKey, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(fileKey)) return null;
        try
        {
            return await fileStorage.GetFileAsync(fileKey, ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning("Could not load image {FileKey}: {Error}", fileKey, ex.Message);
            return null;
        }
    }
}
