using KecCerts.Application.Common.Interfaces;
using KecCerts.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KecCerts.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "SuperAdmin")]
public class UsersController(IIdentityService identityService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await identityService.GetUsersAsync(pageNumber, pageSize, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await identityService.GetUserByIdAsync(id, cancellationToken);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request, CancellationToken cancellationToken)
    {
        var id = await identityService.CreateUserAsync(
            request.Email, request.FirstName, request.LastName,
            request.Password, request.Role, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id }, new { id });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserRequest request, CancellationToken cancellationToken)
    {
        await identityService.UpdateUserAsync(
            id, request.Email, request.FirstName, request.LastName,
            request.Role, request.IsActive, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await identityService.DeleteUserAsync(id, cancellationToken);
        return NoContent();
    }
}

public record CreateUserRequest(string Email, string FirstName, string LastName, string Password, UserRole Role);
public record UpdateUserRequest(string? Email, string? FirstName, string? LastName, UserRole? Role, bool? IsActive);
