// BLL/IService/IUserService.cs
using BLL.Models;
using DAL.Entity;

namespace BLL.IService
{
    public interface IUserService
    {
        Task<ServiceResponse<RefreshTokens>> AddRefreshTokens(RefreshTokens rt);
        AccessTokenResponse GenerateAccessToken(string email, string userRole, Guid userId);
        RefreshTokenResponse GenerateRefreshToken();
        Task<ServiceResponse<TokensResponse>> RefreshAccessToken(string refreshToken);

        // Metodat e reja për profilin
        Task<ServiceResponse<User>> GetUserProfileAsync(Guid userId);
        Task<ServiceResponse<User>> UpdateUserProfileAsync(Guid userId, User updatedUser);
        Task<ServiceResponse<string>> UpdateProfileImageAsync(Guid userId, string imageUrl);
    }
}