using KecCerts.Domain.Enums;

namespace KecCerts.Application.Common.Models;

public record UserDto(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    UserRole Role,
    bool IsActive,
    DateTime CreatedAt);
