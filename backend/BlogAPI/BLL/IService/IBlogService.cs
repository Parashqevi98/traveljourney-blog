using BLL.Models;
using DAL.Entity;

namespace BLL.IService;

public interface IBlogService
{
    Task<ServiceResponse<Category>> AddCategoryAsync(Category entity);
    Task<ServiceResponse<Category>> GetCategoryAsync(Guid categoryId);
    Task<ServiceResponse<bool>> DeleteCategoryAsync(Guid categoryId);
    Task<ServiceResponse<IEnumerable<Category>>> GetAllCategoriesAsync();
    Task<ServiceResponse<Category>> UpdateCategoryAsync(Category entity);
    Task<ServiceResponse<IEnumerable<PostResponse>>> GetPostsByCategoryAsync(Guid categoryId);

    Task<ServiceResponse<Post>> AddPostAsync(Post entity);
    Task<ServiceResponse<PostResponse>> GetPostyAsync(Guid postId);
    Task<ServiceResponse<bool>> DeletePostAsync(Guid categoryId, Guid userId);
    Task<ServiceResponse<Post>> UpdatePostAsync(Post entity);

    Task<ServiceResponse<IEnumerable<PostResponse>>> GetAllPostsPublished(string? q, DateTime? publishAt);
    Task<ServiceResponse<List<PostResponse>>> GetRecentPostsAsync(int count);

    Task<ServiceResponse<List<Post>>> GetPostsByAuthorAsync(Guid authorId);



}