using KecCerts.Application.Common.Models;
using KecCerts.Domain.Enums;

namespace KecCerts.Application.Common.Interfaces;

public interface IIdentityService
{
    Task<AuthResult> AuthenticateAsync(string email, string password, CancellationToken cancellationToken = default);
    Task<AuthResult> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default);
    Task<Guid> CreateUserAsync(string email, string firstName, string lastName, string password, UserRole role, CancellationToken cancellationToken = default);
    Task UpdateUserAsync(Guid userId, string? email, string? firstName, string? lastName, UserRole? role, bool? isActive, CancellationToken cancellationToken = default);
    Task DeleteUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<UserDto?> GetUserByIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<PaginatedList<UserDto>> GetUsersAsync(int pageNumber, int pageSize, CancellationToken cancellationToken = default);
}
