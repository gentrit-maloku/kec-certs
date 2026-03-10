using System.Net;
using System.Text.Json;
using FluentValidation;
using KecCerts.Domain.Exceptions;

namespace KecCerts.Api.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, response) = exception switch
        {
            ValidationException validationEx => (
                HttpStatusCode.BadRequest,
                new ErrorResponse("Validation failed.",
                    validationEx.Errors.Select(e => e.ErrorMessage).ToList())),

            NotFoundException notFoundEx => (
                HttpStatusCode.NotFound,
                new ErrorResponse(notFoundEx.Message)),

            DuplicateException duplicateEx => (
                HttpStatusCode.Conflict,
                new ErrorResponse(duplicateEx.Message)),

            DomainException domainEx => (
                HttpStatusCode.BadRequest,
                new ErrorResponse(domainEx.Message)),

            UnauthorizedAccessException => (
                HttpStatusCode.Forbidden,
                new ErrorResponse("Access denied.")),

            _ => (
                HttpStatusCode.InternalServerError,
                new ErrorResponse("An unexpected error occurred."))
        };

        if (statusCode == HttpStatusCode.InternalServerError)
            logger.LogError(exception, "Unhandled exception occurred");
        else
            logger.LogWarning(exception, "Handled exception: {Message}", exception.Message);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}

public record ErrorResponse(string Message, List<string>? Errors = null);
