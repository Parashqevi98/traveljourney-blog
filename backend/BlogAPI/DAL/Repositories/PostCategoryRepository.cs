using DAL.Entity;
using DAL.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL.Repositories;

public class PostCategoryRepository : Repository <PostCategory>, IPostCategoryRepository
{
    private readonly BlogContext _context;
    public PostCategoryRepository(BlogContext context) : base(context)
    {
        _context = context;
    }
}