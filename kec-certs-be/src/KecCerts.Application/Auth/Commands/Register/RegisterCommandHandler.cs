using KecCerts.Application.Common.Interfaces;
using KecCerts.Domain.Enums;
using MediatR;

namespace KecCerts.Application.Auth.Commands.Register;

public class RegisterCommandHandler(IIdentityService identityService)
    : IRequestHandler<RegisterCommand, Guid>
{
    public async Task<Guid> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        return await identityService.CreateUserAsync(
            request.Email,
            request.FirstName,
            request.LastName,
            request.Password,
            UserRole.User,
            cancellationToken);
    }
}
