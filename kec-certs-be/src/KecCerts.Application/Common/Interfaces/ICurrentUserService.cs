using KecCerts.Domain.Enums;

namespace KecCerts.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid UserId { get; }
    string Email { get; }
    UserRole Role { get; }
}
