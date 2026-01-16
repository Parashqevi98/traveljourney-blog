using BLL.IService;
using BLL.Models;
using DAL;
using DAL.Entity;
using DAL.Enums;
using DAL.ENums;
using DAL.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BLL.Services;

public class BlogService : IBlogService
{
    private readonly UnitOfWork _unitOfWork;

    public BlogService(UnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ServiceResponse<Category>> AddCategoryAsync(Category entity)
    {
        var serviceResponse = new ServiceResponse<Category>();
        try
        {
            await _unitOfWork.Categories.AddAsync(entity);
            await _unitOfWork.CommitAsync();

            serviceResponse.Status = true;
            serviceResponse.Data = entity;
            return serviceResponse;
        }
        catch (Exception e)
        {
            serviceResponse.Status = false;
            serviceResponse.Message = e.Message;
            return serviceResponse;
        }
    }

    public async Task<ServiceResponse<Category>> GetCategoryAsync(Guid categoryId)
    {
        var serviceResponse = new ServiceResponse<Category>();

        var category = await _unitOfWork.Categories.GetByIdAsync(categoryId);

        serviceResponse.Status = true;
        serviceResponse.Data = category;
        return serviceResponse;
    }

    public async Task<ServiceResponse<bool>> DeleteCategoryAsync(Guid categoryId)
    {
        var serviceResponse = new ServiceResponse<bool>();

        var category = await _unitOfWork.Categories.GetByIdAsync(categoryId);
        serviceResponse.Status = true;

        if (category is null)
        {
            serviceResponse.Data = false;
            serviceResponse.Message = "Category not found";

            return serviceResponse;
        }

        var postCategoriesQuery = _unitOfWork.PostCategories.GetAll();

        var postCategoriesCount = postCategoriesQuery.Where(pc => pc.CategoryGuid == categoryId)?.Count();

        if (postCategoriesCount > 0)
        {
            serviceResponse.Data = false;
            serviceResponse.Message = "Category has blog post's and can't be deleted";

            return serviceResponse;
        }

        _unitOfWork.Categories.Remove(category);
        await _unitOfWork.CommitAsync();

        serviceResponse.Data = true;
        return serviceResponse;
    }

    public async Task<ServiceResponse<IEnumerable<Category>>> GetAllCategoriesAsync()
    {
        var serviceResponse = new ServiceResponse<IEnumerable<Category>>();
        serviceResponse.Status = true;

        var categoriesQuery = _unitOfWork.Categories.GetAll();

        serviceResponse.Data = await categoriesQuery.ToListAsync();

        return serviceResponse;
    }

    public async Task<ServiceResponse<Category>> UpdateCategoryAsync(Category entity)
    {
        var serviceResponse = new ServiceResponse<Category>();
        try
        {
            var category = await _unitOfWork.Categories.GetByIdAsync(entity.Id);
            serviceResponse.Status = true;

            if (category is null)
            {
                serviceResponse.Status = false;
                serviceResponse.Message = "Category not found";

                return serviceResponse;
            }

            category.Name = entity.Name;
            category.Description = entity.Description;

            _unitOfWork.Categories.Update(category);
            await _unitOfWork.CommitAsync();

            serviceResponse.Data = category;

            return serviceResponse;
        }
        catch (Exception e)
        {
            serviceResponse.Status = false;
            serviceResponse.Message = e.Message;
            return serviceResponse;
        }

    }
    public async Task<ServiceResponse<IEnumerable<PostResponse>>> GetPostsByCategoryAsync(Guid categoryId)
    {
        var posts = await _unitOfWork.Post.GetPostsByCategoryAsync(categoryId);

        if (posts == null || !posts.Any())
        {
            return new ServiceResponse<IEnumerable<PostResponse>>
            {
                Status = false,
                Message = "No posts found for the given category.",
                Data = null
            };
        }

        var postResponses = posts.Select(post => new PostResponse
        {
            Guid = post.Guid,
            Title = post.Title,
            Content = post.Content,
            CreatedAt = post.CreatedAt,
            PublishAt = post.PublishAt,
            UpdatedAt = post.UpdatedAt,
            UserId = post.UserId,
            UserName = post.User?.UserName,
            Status = post.Status.ToString(),
            ImageUrl = post.ImageUrl,
            Categories = post.PostCategories.Select(pc => new CategoryResponse
            {
                Id = pc.Category.Id,
                Name = pc.Category.Name,
                Description = pc.Category.Description
            })
        });

        return new ServiceResponse<IEnumerable<PostResponse>>
        {
            Status = true,
            Message = "Posts retrieved successfully.",
            Data = postResponses
        };
    }



    public async Task<ServiceResponse<Post>> AddPostAsync(Post entity)
    {
        var serviceResponse = new ServiceResponse<Post>();
        try
        {
            var validPostCategories = new List<PostCategory>();
            if (entity.PostCategories != null)
            {
                foreach (var postCategory in entity.PostCategories)
                {
                    var category = await _unitOfWork.Categories.GetByIdAsync(postCategory.CategoryGuid);
                    if (category != null)
                    {
                        validPostCategories.Add(postCategory);
                    }
                }
            }


            entity.PostCategories = validPostCategories;

            await _unitOfWork.Post.AddAsync(entity);
            await _unitOfWork.CommitAsync();

            serviceResponse.Status = true;
            serviceResponse.Data = entity;
            return serviceResponse;
        }
        catch (Exception e)
        {
            serviceResponse.Status = false;
            serviceResponse.Message = e.Message;
            return serviceResponse;
        }
    }

    public async Task<ServiceResponse<PostResponse>> GetPostyAsync(Guid postId)
    {
        var serviceResponse = new ServiceResponse<PostResponse>();

        try
        {
            var post = await _unitOfWork.Post.GetByIdIncludedCategoriesAsync(postId);

            // Kontrollo nëse post është null
            if (post == null)
            {
                serviceResponse.Status = false;
                serviceResponse.Message = "Post not found";
                return serviceResponse;
            }

            var user = await _unitOfWork.Users.GetByIdAsync(post.UserId);

            // Kontrollo nëse user është null
            if (user == null)
            {
                serviceResponse.Status = false;
                serviceResponse.Message = "User not found for this post";
                return serviceResponse;
            }

            var categories = new List<CategoryResponse>();
            if (post.PostCategories != null)
            {
                foreach (var postCategory in post.PostCategories)
                {
                    if (postCategory.Category != null)
                    {
                        categories.Add(new CategoryResponse
                        {
                            CategoryName = postCategory.Category.Name,
                            Id = postCategory.CategoryGuid,
                        });
                    }
                }
            }

            var postResponse = new PostResponse
            {
                UserId = user.Id,
                Guid = post.Guid,
                Categories = categories,
                UserName = user.FirstName + " " + user.LastName,
                Status = post.Status.ToString(),
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.UpdatedAt,
                Title = post.Title,
                Content = post.Content,
                PublishAt = post.PublishAt,
                ImageUrl = post.ImageUrl
            };

            serviceResponse.Status = true;
            serviceResponse.Data = postResponse;
            return serviceResponse;
        }
        catch (Exception e)
        {
            serviceResponse.Status = false;
            serviceResponse.Message = $"An error occurred: {e.Message}";
            return serviceResponse;
        }
    }

    public async Task<ServiceResponse<bool>> DeletePostAsync(Guid postId, Guid userId)
    {
        var serviceResponse = new ServiceResponse<bool>();

        var post = await _unitOfWork.Post.GetByIdAsync(postId);
        serviceResponse.Status = true;

        if (post is null)
        {
            serviceResponse.Data = false;
            serviceResponse.Message = "Post not found";

            return serviceResponse;
        }

        if (userId != post.UserId)
        {
            serviceResponse.Data = false;
            serviceResponse.Message = "Post cannot be deleted because user does not belong to this post";

            return serviceResponse;
        }

        _unitOfWork.Post.Remove(post);
        await _unitOfWork.CommitAsync();

        serviceResponse.Data = true;
        return serviceResponse;
    }

    public async Task<ServiceResponse<Post>> UpdatePostAsync(Post entity)
    {
        var serviceResponse = new ServiceResponse<Post>();

        try
        {
            var post = await _unitOfWork.Post.GetByIdIncludedCategoriesAsync(entity.Guid);
            serviceResponse.Status = true;

            if (post is null)
            {
                serviceResponse.Status = false;
                serviceResponse.Message = "Post not found";

                return serviceResponse;
            }

            if (entity.UserId != post.UserId)
            {
                serviceResponse.Status = false;
                serviceResponse.Message = "Post cannot be edited because user does not belong to this post";

                return serviceResponse;
            }

            // Remove existing Post Categories
            foreach (var postCategories in post.PostCategories)
            {
                postCategories.Category = null;

                _unitOfWork.PostCategories.Remove(postCategories);
            }

            // Add New Post Categories
            var validPostCategories = new List<PostCategory>();
            if (entity.PostCategories != null)
            {
                foreach (var postCategory in entity.PostCategories)
                {
                    var category = await _unitOfWork.Categories.GetByIdAsync(postCategory.CategoryGuid);
                    if (category != null)
                    {
                        validPostCategories.Add(postCategory);
                    }
                }
            }

            post.PostCategories = validPostCategories;
            post.UpdatedAt = DateTime.Now;
            post.Title = entity.Title;
            post.Content = entity.Content;
            post.PublishAt = entity.PublishAt;


            _unitOfWork.Post.Update(entity);
            await _unitOfWork.CommitAsync();

            serviceResponse.Status = true;
            serviceResponse.Data = post;

            return serviceResponse;
        }
        catch (Exception e)
        {
            serviceResponse.Status = false;
            serviceResponse.Message = e.Message;
            return serviceResponse;
        }
    }

    public async Task<ServiceResponse<IEnumerable<PostResponse>>> GetAllPostsPublished(string? q, DateTime? publishAt)
    {
        var serviceResponse = new ServiceResponse<IEnumerable<PostResponse>>();

        var postQuery = _unitOfWork.Post.GetAllIncludedAsync();

        postQuery = postQuery.Where(p => p.Status == PostStatus.Public);

        if (publishAt.HasValue)
        {
            postQuery = postQuery.Where(p => p.PublishAt >= publishAt.Value);
        }

        if (!String.IsNullOrEmpty(q))
        {
            postQuery = postQuery.Where(p =>
                (p.Title.Contains(q)) ||
                (p.Content != null && p.Content.Contains(q)));
        }

        var postList = await postQuery.ToListAsync();


        var postResponseList = new List<PostResponse>();

        foreach (var post in postList)
        {
            var categories = new List<CategoryResponse>();
            if (post?.PostCategories != null)
            {
                foreach (var postCategory in post.PostCategories)
                {
                    categories.Add(new CategoryResponse
                    {
                        CategoryName = postCategory.Category.Name,
                        Id = postCategory.CategoryGuid,
                    });
                }
            }
            postResponseList.Add(new PostResponse
            {
                UserId = post.UserId,
                Guid = post.Guid,
                Categories = categories,
                UserName = post.User.FirstName + " " + post.User.LastName,
                Status = post.Status.ToString(),
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.UpdatedAt,
                Title = post.Title,
                Content = post.Content,
                PublishAt = post.PublishAt,
                ImageUrl = post.ImageUrl

            });

        }


        serviceResponse.Status = true;
        serviceResponse.Data = postResponseList;
        return serviceResponse;
    }
    public async Task<ServiceResponse<List<PostResponse>>> GetRecentPostsAsync(int count)
    {
        var serviceResponse = new ServiceResponse<List<PostResponse>>();

        try
        {
            var postsQuery = _unitOfWork.Post.GetAllIncludedAsync();

            var recentPosts = await postsQuery
                .Where(p => p.Status == PostStatus.Public)
                .OrderByDescending(p => p.CreatedAt)
                .Take(count)
                .ToListAsync();

            var postResponses = recentPosts.Select(post => new PostResponse
            {
                Guid = post.Guid,
                Title = post.Title,
                Content = post.Content,
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.UpdatedAt,
                PublishAt = post.PublishAt,
                Status = post.Status.ToString(),
                UserId = post.UserId,
                UserName = post.User?.FirstName + " " + post.User?.LastName,
                ImageUrl = post.ImageUrl,
                Categories = post.PostCategories?.Select(pc => new CategoryResponse
                {
                    Id = pc.Category.Id,
                    Name = pc.Category.Name,
                    Description = pc.Category.Description
                }).ToList()
            }).ToList();

            serviceResponse.Status = true;
            serviceResponse.Message = "Recent posts fetched successfully.";
            serviceResponse.Data = postResponses;
        }
        catch (Exception e)
        {
            serviceResponse.Status = false;
            serviceResponse.Message = $"Error fetching recent posts: {e.Message}";
        }

        return serviceResponse;
    }

    public async Task<ServiceResponse<List<Post>>> GetPostsByAuthorAsync(Guid authorId)
    {
        var serviceResponse = new ServiceResponse<List<Post>>();

        try
        {
            // Përdorim metodën e re nga PostRepository
            var posts = await _unitOfWork.Post.GetPostsByAuthorAsync(authorId);

            if (posts == null || !posts.Any())
            {
                serviceResponse.Status = true;
                serviceResponse.Message = "No posts found for this author";
                serviceResponse.Data = new List<Post>();
                return serviceResponse;
            }

            serviceResponse.Status = true;
            serviceResponse.Data = posts.ToList();
            return serviceResponse;
        }
        catch (Exception e)
        {
            serviceResponse.Status = false;
            serviceResponse.Message = e.Message;
            return serviceResponse;
        }
    }
}
