using DAL.Entity;
using DAL.Enums;
using DAL.ENums;
using DAL.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL.Repositories
{
    public class PostRepository : Repository<Post>, IPostRepository
    {
        private readonly BlogContext _context;

        public PostRepository(BlogContext context) : base(context)
        {
            _context = context;
        }

        public async Task<Post> GetByIdIncludedCategoriesAsync(Guid id)
        {
            return await _context.Posts
                .Include(p => p.PostCategories)
                .ThenInclude(pc => pc.Category)
                .FirstOrDefaultAsync(p => p.Guid == id);
        }

        public async Task<IEnumerable<Post>> GetPostsByCategoryAsync(Guid categoryId)
        {
            return await _context.Posts
                .Include(p => p.PostCategories)
                .ThenInclude(pc => pc.Category)
                .Where(p => p.PostCategories.Any(pc => pc.CategoryGuid == categoryId) && p.Status == PostStatus.Public)
                .ToListAsync();
        }

        public IQueryable<Post> GetAllIncludedAsync()
        {
            return _context.Posts
                .Include(p => p.PostCategories)
                .ThenInclude(pc => pc.Category)
                .Include(p => p.User)
                .AsQueryable();
        }

        // Metoda e re për të marrë postimet sipas autorit
        public async Task<List<Post>> GetPostsByAuthorAsync(Guid authorId)
        {
            return await _context.Posts
                .Include(p => p.PostCategories)
                .ThenInclude(pc => pc.Category)
                .Include(p => p.User)
                .Where(p => p.UserId == authorId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        // Shtoni këtu edhe një metodë për të marrë postimet publike të një autori nëse dëshironi
        public async Task<List<Post>> GetPublicPostsByAuthorAsync(Guid authorId)
        {
            return await _context.Posts
                .Include(p => p.PostCategories)
                .ThenInclude(pc => pc.Category)
                .Include(p => p.User)
                .Where(p => p.UserId == authorId && p.Status == PostStatus.Public)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        // Shtoni këtu metodë për të marrë postimet e fundit publike
        public async Task<List<Post>> GetRecentPostsAsync(int count)
        {
            return await _context.Posts
                .Include(p => p.PostCategories)
                .ThenInclude(pc => pc.Category)
                .Include(p => p.User)
                .Where(p => p.Status == PostStatus.Public)
                .OrderByDescending(p => p.CreatedAt)
                .Take(count)
                .ToListAsync();
        }
    }
}