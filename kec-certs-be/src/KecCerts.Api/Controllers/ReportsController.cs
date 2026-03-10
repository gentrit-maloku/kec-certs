using KecCerts.Application.Reports.Queries.ExportData;
using KecCerts.Application.Reports.Queries.GetStatistics;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KecCerts.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "AdminOrAbove")]
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
        [FromQuery] Guid? programId = null,
        [FromQuery] DateOnly? fromDate = null,
        [FromQuery] DateOnly? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var query = new ExportCertificatesQuery(format, programId, fromDate, toDate);
        var result = await mediator.Send(query, cancellationToken);
        return File(result.Content, result.ContentType, result.FileName);
    }
}
