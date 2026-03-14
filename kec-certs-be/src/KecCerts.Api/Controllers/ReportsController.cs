using KecCerts.Application.Reports.Queries.ExportData;
using KecCerts.Application.Reports.Queries.GetStatistics;
using KecCerts.Application.Reports.Queries.PrintCertificates;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KecCerts.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController(ISender mediator) : ControllerBase
{
    [HttpGet("statistics")]
    public async Task<IActionResult> GetStatistics(CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetStatisticsQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export(
        [FromQuery] string format = "xlsx",
        [FromQuery] string? search = null,
        [FromQuery] Guid? programId = null,
        [FromQuery] DateOnly? fromDate = null,
        [FromQuery] DateOnly? toDate = null,
        [FromQuery] int? fromSerial = null,
        [FromQuery] int? toSerial = null,
        CancellationToken cancellationToken = default)
    {
        var query = new ExportCertificatesQuery(format, search, programId, fromDate, toDate, fromSerial, toSerial);
        var result = await mediator.Send(query, cancellationToken);
        return File(result.Content, result.ContentType, result.FileName);
    }

    [HttpGet("print-certificates")]
    public async Task<IActionResult> PrintCertificates(
        [FromQuery] string? search = null,
        [FromQuery] Guid? programId = null,
        [FromQuery] DateOnly? fromDate = null,
        [FromQuery] DateOnly? toDate = null,
        [FromQuery] int? fromSerial = null,
        [FromQuery] int? toSerial = null,
        CancellationToken cancellationToken = default)
    {
        var query = new PrintCertificatesQuery(search, programId, fromDate, toDate, fromSerial, toSerial);
        var pdfBytes = await mediator.Send(query, cancellationToken);
        return File(pdfBytes, "application/pdf", $"certifikata_{DateTime.UtcNow:yyyyMMdd}.pdf");
    }
}
