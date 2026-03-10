using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using KecCerts.Application.Common.Interfaces;
using KecCerts.Application.Common.Models;
using KecCerts.Domain.Entities;
using KecCerts.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace KecCerts.Infrastructure.Identity;

public class IdentityService(
    UserManager<ApplicationUser> userManager,
    IConfiguration configuration)
    : IIdentityService
{
    public async Task<AuthResult> AuthenticateAsync(string email, string password, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByEmailAsync(email);
        if (user is null || !user.IsActive)
            return new AuthResult(false, Error: "Invalid credentials.");

        var valid = await userManager.CheckPasswordAsync(user, password);
        if (!valid)
            return new AuthResult(false, Error: "Invalid credentials.");

        var accessToken = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();
        var expiresAt = DateTime.UtcNow.AddHours(
            double.Parse(configuration["Jwt:ExpirationHours"] ?? "8"));

        return new AuthResult(true, accessToken, refreshToken, expiresAt);
    }

    public Task<AuthResult> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        // TODO: Implement refresh token validation and rotation
        throw new NotImplementedException("Refresh token support to be implemented.");
    }

    public async Task<Guid> CreateUserAsync(string email, string firstName, string lastName, string password, UserRole role, CancellationToken cancellationToken = default)
    {
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = email,
            UserName = email,
            FirstName = firstName,
            LastName = lastName,
            Role = role
        };

        var result = await userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Failed to create user: {errors}");
        }

        return user.Id;
    }

    public async Task UpdateUserAsync(Guid userId, string? email, string? firstName, string? lastName, UserRole? role, bool? isActive, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId.ToString())
            ?? throw new InvalidOperationException($"User {userId} not found.");

        if (email is not null) { user.Email = email; user.UserName = email; }
        if (firstName is not null) user.FirstName = firstName;
        if (lastName is not null) user.LastName = lastName;
        if (role.HasValue) user.Role = role.Value;
        if (isActive.HasValue) user.IsActive = isActive.Value;
        user.UpdatedAt = DateTime.UtcNow;

        await userManager.UpdateAsync(user);
    }

    public async Task DeleteUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId.ToString())
            ?? throw new InvalidOperationException($"User {userId} not found.");

        await userManager.DeleteAsync(user);
    }

    public async Task<UserDto?> GetUserByIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null) return null;

        return new UserDto(user.Id, user.Email!, user.FirstName, user.LastName, user.Role, user.IsActive, user.CreatedAt);
    }

    public Task<PaginatedList<UserDto>> GetUsersAsync(int pageNumber, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = userManager.Users
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new UserDto(u.Id, u.Email!, u.FirstName, u.LastName, u.Role, u.IsActive, u.CreatedAt));

        return PaginatedList<UserDto>.CreateAsync(query, pageNumber, pageSize, cancellationToken);
    }

    private string GenerateJwtToken(ApplicationUser user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT key not configured.")));

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email!),
            new(ClaimTypes.Name, user.FullName),
            new("role", user.Role.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(double.Parse(configuration["Jwt:ExpirationHours"] ?? "8")),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }
}
