using KecCerts.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;
using QuestPDF.Fluent;
using QuestPDF.Helpers;

namespace KecCerts.Infrastructure.Services;

/// <summary>
/// Generates PDF certificates using QuestPDF.
/// The current implementation generates a placeholder certificate.
/// In production, this should load the template file and overlay placeholder values.
/// </summary>
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
        logger.LogInformation(
            "Generating certificate with template {TemplateKey} and {PlaceholderCount} placeholders",
            templateFileKey, placeholderValues.Count);

        // Load the template file
        var templateBytes = await fileStorage.GetFileAsync(templateFileKey, cancellationToken);

        // TODO: Implement actual template rendering with QuestPDF.
        // The template file format and rendering approach should be decided during implementation.
        // For now, generate a simple placeholder PDF using QuestPDF.

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(50);

                page.Content().Column(column =>
                {
                    column.Spacing(20);

                    column.Item().AlignCenter().Text("CERTIFIKATE")
                        .FontSize(28).Bold();

                    column.Item().AlignCenter().Text(text =>
                    {
                        text.Span("Vertetohet se ");
                        text.Span(placeholderValues.GetValueOrDefault("Emri", "")).Bold().FontSize(16);
                        text.Span(" ");
                        text.Span(placeholderValues.GetValueOrDefault("Mbiemri", "")).Bold().FontSize(16);
                    });

                    column.Item().AlignCenter()
                        .Text("ka perfunduar me sukses programin e trajnimit:")
                        .FontSize(12);

                    column.Item().AlignCenter()
                        .Text(placeholderValues.GetValueOrDefault("Programi", ""))
                        .FontSize(18).Bold();

                    if (placeholderValues.TryGetValue("Nota", out var grade) && !string.IsNullOrEmpty(grade))
                    {
                        column.Item().AlignCenter()
                            .Text($"Nota: {grade}")
                            .FontSize(14);
                    }

                    column.Item().AlignCenter()
                        .Text($"Data: {placeholderValues.GetValueOrDefault("Data", "")}")
                        .FontSize(12);

                    column.Item().AlignCenter()
                        .Text($"Nr. Serial: {placeholderValues.GetValueOrDefault("NumriSerial", "")}")
                        .FontSize(10).Italic();
                });
            });
        });

        return document.GeneratePdf();
    }
}
