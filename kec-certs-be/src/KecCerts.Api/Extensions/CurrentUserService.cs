using System.Security.Claims;
using KecCerts.Application.Common.Interfaces;
using KecCerts.Domain.Enums;

namespace KecCerts.Api.Extensions;

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    public Guid UserId =>
        Guid.Parse(httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());

    public string Email =>
        httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;

    public UserRole Role =>
        Enum.TryParse<UserRole>(httpContextAccessor.HttpContext?.User.FindFirstValue("role"), out var role)
            ? role
            : UserRole.Viewer;
}
