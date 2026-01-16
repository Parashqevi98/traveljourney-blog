
using DAL.Entity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DAL.Interfaces
{
    public interface IPostRepository : IRepository<Post>
    {
        Task<Post> GetByIdIncludedCategoriesAsync(Guid id);
        Task<IEnumerable<Post>> GetPostsByCategoryAsync(Guid categoryId);
        IQueryable<Post> GetAllIncludedAsync();

        // Metodat e reja
        Task<List<Post>> GetPostsByAuthorAsync(Guid authorId);
        Task<List<Post>> GetPublicPostsByAuthorAsync(Guid authorId);
        Task<List<Post>> GetRecentPostsAsync(int count);
    }
}