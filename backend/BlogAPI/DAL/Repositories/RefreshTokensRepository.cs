using DAL.Entity;
using DAL.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL.Repositories;

public class RefreshTokensRepository : Repository<RefreshTokens>, IRefreshTokensRepository
{
    private readonly BlogContext _context;
    public RefreshTokensRepository(BlogContext context) : base(context)
    {
        _context = context;
    }

    public RefreshTokens GetByToken(string token)
    {
        return _context.RefreshTokens.AsNoTracking().FirstOrDefault(rt => rt.RefreshToken == token);
    }
}