using KecCerts.Application.Common.Interfaces;
using KecCerts.Application.Common.Models;
using MediatR;

namespace KecCerts.Application.Auth.Commands.Login;

public class LoginCommandHandler(IIdentityService identityService)
    : IRequestHandler<LoginCommand, AuthResult>
{
    public async Task<AuthResult> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        return await identityService.AuthenticateAsync(request.Email, request.Password, cancellationToken);
    }
}
