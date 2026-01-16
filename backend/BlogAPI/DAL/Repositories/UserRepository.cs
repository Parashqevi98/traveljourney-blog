using DAL;
using DAL.Entity;
using DAL.Interfaces;
using DAL.Models;
using DAL.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;

namespace DAL.Repositories;

public class UserRepository : Repository<User>, IUserRepository
{
    private readonly BlogContext _context;

    public UserRepository(BlogContext context) : base(context)
    {
        _context = context;
    }

    public UserRoles GetUserWithRoles(Guid userId)
    {
        var userWithRoles = (from user in _context.Users
                             where user.Id == userId
                             select new
                             {
                                 UserId = user.Id,
                                 Username = user.UserName,
                                 Email = user.Email,
                                 Roles = (from userRole in _context.UserRoles
                                          join role in _context.Roles on userRole.RoleId equals role.Id
                                          where userRole.UserId == user.Id
                                          select new
                                          {
                                              RoleId = role.Id,
                                              RoleName = role.Name
                                          }).ToList()
                             })
            .AsEnumerable()
            .Select(p => new UserRoles
            {
                UserId = p.UserId,
                Email = p.Email,
                RoleId = p.Roles.FirstOrDefault()?.RoleId,
                RoleName = p.Roles.FirstOrDefault()?.RoleName
            })
            .SingleOrDefault();

        return userWithRoles;
    }
}