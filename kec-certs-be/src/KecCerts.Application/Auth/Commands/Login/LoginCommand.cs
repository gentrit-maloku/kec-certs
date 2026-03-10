using KecCerts.Application.Common.Models;
using MediatR;

namespace KecCerts.Application.Auth.Commands.Login;

public record LoginCommand(string Email, string Password) : IRequest<AuthResult>;
