using System.Text;
using KecCerts.Application.Common.Interfaces;
using KecCerts.Infrastructure.FileStorage;
using KecCerts.Infrastructure.Identity;
using KecCerts.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace KecCerts.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // QuestPDF License
        QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

        // JWT Authentication
        var jwtKey = configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT key not configured.");

        services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = configuration["Jwt:Issuer"],
                    ValidAudience = configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                    RoleClaimType = "role",
                    NameClaimType = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
                };
                options.MapInboundClaims = false;
            });

        // Authorization policies
        services.AddAuthorizationBuilder()
            .AddPolicy("SuperAdmin", policy => policy.RequireClaim("role", "SuperAdmin"))
            .AddPolicy("AdminOrAbove", policy => policy.RequireClaim("role", "SuperAdmin", "Admin"))
            .AddPolicy("UserOrAbove", policy => policy.RequireClaim("role", "SuperAdmin", "Admin", "User"))
            .AddPolicy("ViewerOrAbove", policy => policy.RequireClaim("role", "SuperAdmin", "Admin", "User", "Viewer"));

        // Services
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddScoped<ICertificateGenerator, PdfCertificateGenerator>();
        services.AddScoped<IFileStorageService, LocalFileStorageService>();
        services.AddScoped<IExcelParser, ExcelParserService>();
        services.AddScoped<IExportService, ExportService>();

        return services;
    }
}
