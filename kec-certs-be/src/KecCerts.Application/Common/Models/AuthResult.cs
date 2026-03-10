namespace KecCerts.Application.Common.Models;

public record AuthResult(
    bool Succeeded,
    string? AccessToken = null,
    string? RefreshToken = null,
    DateTime? ExpiresAt = null,
    string? Error = null);
