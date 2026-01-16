
using DAL.Entity;

namespace DAL.Interfaces;

public interface IRefreshTokensRepository : IRepository<RefreshTokens>
{
    RefreshTokens GetByToken(string token);
}