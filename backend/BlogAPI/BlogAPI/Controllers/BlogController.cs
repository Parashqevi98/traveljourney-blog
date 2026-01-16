using BLL.IService;
using BLL.Models;
using BlogAPI.Dtos.Blog;
using BlogAPI.Helpers;
using BlogAPI.Models;
using DAL.Entity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient.Server;
using System.Security.Claims;

namespace BlogAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BlogController : ControllerBase
    {
        private readonly IBlogService _blogService;
        private readonly string _baseUrl;

        public BlogController(IBlogService blogService, IConfiguration configuration)
        {
            _blogService = blogService;
            _baseUrl = configuration["BaseUrl"] ?? "http://127.0.0.1:5500";
        }

        // ============ SEO ENDPOINTS ============
        [HttpGet("seo/post/{postId}")]
        [AllowAnonymous]
        public async Task<ActionResult<SeoMetaData>> GetPostSeoData(Guid postId)
        {
            var response = await _blogService.GetPostyAsync(postId);
            if (!response.Status || response.Data == null)
            {
                return NotFound(new ErrorDto
                {
                    Code = "PostNotFound",
                    Description = "Post not found for SEO data"
                });
            }

            var seoData = SeoHelper.GeneratePostSeo(response.Data, _baseUrl);
            return Ok(seoData);
        }

        [HttpGet("seo/category/{categoryId}")]
        [AllowAnonymous]
        public async Task<ActionResult<SeoMetaData>> GetCategorySeoData(Guid categoryId)
        {
            var categoryResponse = await _blogService.GetCategoryAsync(categoryId);
            if (!categoryResponse.Status || categoryResponse.Data == null)
            {
                return NotFound();
            }

            var seoData = SeoHelper.GenerateCategorySeo(categoryResponse.Data, _baseUrl);
            return Ok(seoData);
        }

        [HttpGet("seo/homepage")]
        [AllowAnonymous]
        public ActionResult<SeoMetaData> GetHomepageSeoData()
        {
            var seoData = new SeoMetaData
            {
                Title = "TravelJourney.al - Authentic Albanian Travel Experiences & Stories",
                Description = "Discover Albania through authentic travel stories and experiences shared by real travelers. Explore hidden gems, local culture, adventure chronicles and unforgettable journeys across Albanian destinations.",
                Keywords = "Albania travel, Albanian tourism, Balkans travel, authentic experiences, travel blog, hidden gems Albania, Albanian culture, adventure travel, local wisdom, Southeast Europe tourism",
                CanonicalUrl = _baseUrl,
                AuthorName = "TravelJourney Community",
                PublishedDate = DateTime.UtcNow,
                ModifiedDate = DateTime.UtcNow
            };

            return Ok(seoData);
        }

        [HttpGet("seo/posts")]
        [AllowAnonymous]
        public ActionResult<SeoMetaData> GetPostsPageSeoData()
        {
            var seoData = new SeoMetaData
            {
                Title = "All Travel Posts - Discover Albania | TravelJourney.al",
                Description = "Browse all authentic travel experiences and stories from Albania. Find inspiration for your next adventure through real traveler experiences and local insights from the Albanian Riviera to the Albanian Alps.",
                Keywords = "Albania travel posts, travel stories Albania, Albanian experiences, travel blog posts, Balkans adventures, Albanian destinations",
                CanonicalUrl = $"{_baseUrl}/posts"
            };

            return Ok(seoData);
        }

        [HttpGet("seo/categories")]
        [AllowAnonymous]
        public ActionResult<SeoMetaData> GetCategoriesPageSeoData()
        {
            var seoData = new SeoMetaData
            {
                Title = "Travel Categories - Explore Albania by Interest | TravelJourney.al",
                Description = "Explore Albanian destinations by categories: Adventure Chronicles, Culture Code, Hidden Gems, Local Wisdom, and more. Find travel experiences that match your interests in the heart of the Balkans.",
                Keywords = "Albania travel categories, adventure travel Albania, cultural experiences Albania, hidden gems Balkans, local wisdom Albania, Albanian gastronomy, nightlife Albania",
                CanonicalUrl = $"{_baseUrl}/categories"
            };

            return Ok(seoData);
        }

        [HttpGet("seo/about")]
        [AllowAnonymous]
        public ActionResult<SeoMetaData> GetAboutPageSeoData()
        {
            var seoData = new SeoMetaData
            {
                Title = "About TravelJourney.al - Your Gateway to Authentic Albanian Travel",
                Description = "Learn about TravelJourney.al, a community-driven platform sharing authentic Albanian travel experiences. Discover our mission to showcase Albania's hidden beauty through real traveler stories.",
                Keywords = "about TravelJourney, Albanian travel community, authentic travel Albania, travel blog about Albania, Albanian tourism platform",
                CanonicalUrl = $"{_baseUrl}/about"
            };

            return Ok(seoData);
        }

        // ============ ORIGINAL ENDPOINTS ============

        [HttpPost]
        [Route("AddCategory")]
        public async Task<ActionResult> AddCategory([FromBody] CategoryDto model)
        {
            if (!ModelState.IsValid)
            {
                var error = new ErrorDto
                {
                    Code = "InvalidModel",
                    Description = "The model is not valid."
                };
                return BadRequest(error);
            }

            var category = new Category
            {
                Name = model.CategoryName.ToLower(),
                Description = model.CategoryDescription.ToLower(),
            };

            var categoryResponse = await _blogService.AddCategoryAsync(category);

            if (!categoryResponse.Status)
            {
                var error = new ErrorDto
                {
                    Code = "Error",
                    Description = categoryResponse.Message
                };
                return BadRequest(error);
            }

            return Ok(categoryResponse.Data);
        }

        [HttpGet]
        [Route("GetCategories/{categoryId}")]
        [AllowAnonymous]
        public async Task<ActionResult> GetCategories(Guid categoryId)
        {
            var categoryResponse = await _blogService.GetCategoryAsync(categoryId);
            return Ok(categoryResponse.Data);
        }

        [HttpDelete]
        [Route("DeleteCategory/{categoryId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> DeleteCategory(Guid categoryId)
        {
            var categoryResponse = await _blogService.DeleteCategoryAsync(categoryId);

            if (!categoryResponse.Status || !categoryResponse.Data)
            {
                var error = new ErrorDto
                {
                    Code = "Error",
                    Description = categoryResponse.Message
                };
                return BadRequest(error);
            }

            return Ok(new
            {
                Message = "Category deleted successfully",
                Status = categoryResponse.Data
            });
        }

        [HttpGet]
        [Route("GetAllCategories")]
        [AllowAnonymous]
        public async Task<ActionResult> GetAllCategories()
        {
            var categoryResponse = await _blogService.GetAllCategoriesAsync();
            return Ok(categoryResponse.Data);
        }

        [HttpPut]
        [Route("EditCategory")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> EditCategory(EditCategoryDto model)
        {
            var category = new Category
            {
                Id = model.Id,
                Name = model.Name,
                Description = model.Description,
            };

            var categoryResponse = await _blogService.UpdateCategoryAsync(category);

            if (!categoryResponse.Status)
            {
                var error = new ErrorDto
                {
                    Code = "Error",
                    Description = categoryResponse.Message
                };
                return BadRequest(error);
            }

            return Ok(categoryResponse.Data);
        }

        [HttpGet("GetPostsByCategory/{categoryId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPostsByCategory(Guid categoryId)
        {
            var response = await _blogService.GetPostsByCategoryAsync(categoryId);

            if (!response.Status)
            {
                return NotFound(new ErrorDto
                {
                    Code = "NotFound",
                    Description = response.Message
                });
            }

            return Ok(response.Data);
        }

        [HttpPost]
        [Route("AddBlogPost")]
        [Authorize]
        public async Task<ActionResult> AddBlogPost([FromBody] PostDto model)
        {
            if (!ModelState.IsValid)
            {
                var error = new ErrorDto
                {
                    Code = "InvalidModel",
                    Description = "The model is not valid."
                };
                return BadRequest(error);
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            Guid userId = Guid.Parse(userIdClaim);

            var postCategory = new List<PostCategory>();

            if (model?.Categories != null)
            {
                foreach (var category in model.Categories)
                {
                    postCategory.Add(new PostCategory
                    {
                        CategoryGuid = category
                    });
                }
            }

            var post = new Post
            {
                Title = model.Title,
                Content = model.Content,
                UserId = userId,
                PostCategories = postCategory,
                CreatedAt = DateTime.UtcNow,
                Status = model.Status,
                PublishAt = model.PublishAt,
                UpdatedAt = DateTime.UtcNow,
                ImageUrl = model.ImageUrl
            };

            var postResponse = await _blogService.AddPostAsync(post);

            if (!postResponse.Status)
            {
                var error = new ErrorDto
                {
                    Code = "Error",
                    Description = postResponse.Message
                };
                return BadRequest(error);
            }

            return Ok(postResponse.Data);
        }

        [HttpGet]
        [Route("GetPosts/{postId}")]
        [AllowAnonymous]
        public async Task<ActionResult> GetPosts(Guid postId)
        {
            try
            {
                var postResponse = await _blogService.GetPostyAsync(postId);

                if (!postResponse.Status || postResponse.Data == null)
                {
                    var error = new ErrorDto
                    {
                        Code = "NotFound",
                        Description = postResponse.Message ?? "Post not found"
                    };
                    return NotFound(error);
                }

                return Ok(postResponse.Data);
            }
            catch (Exception ex)
            {
                var error = new ErrorDto
                {
                    Code = "ServerError",
                    Description = "An unexpected error occurred"
                };
                Console.WriteLine($"Error in GetPosts: {ex.Message}");
                return StatusCode(500, error);
            }
        }

        [HttpPut]
        [Route("EditPost")]
        [Authorize]
        public async Task<ActionResult> EditPost(EditPostDto model)
        {
            if (!ModelState.IsValid)
            {
                var error = new ErrorDto
                {
                    Code = "InvalidModel",
                    Description = "The model is not valid."
                };
                return BadRequest(error);
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            Guid userId = Guid.Parse(userIdClaim);

            var postCategory = new List<PostCategory>();

            if (model?.Categories != null)
            {
                foreach (var category in model.Categories)
                {
                    postCategory.Add(new PostCategory
                    {
                        CategoryGuid = category
                    });
                }
            }

            var post = new Post
            {
                Guid = model.Id,
                Title = model.Title,
                Content = model.Content,
                PublishAt = model.PublishAt,
                Status = model.Status,
                UserId = userId,
                PostCategories = postCategory,
                ImageUrl = model.ImageUrl,
                UpdatedAt = DateTime.UtcNow
            };

            var postResponse = await _blogService.UpdatePostAsync(post);

            if (!postResponse.Status)
            {
                var error = new ErrorDto
                {
                    Code = "Error",
                    Description = postResponse.Message
                };
                return BadRequest(error);
            }

            return Ok(postResponse.Data);
        }

        [HttpDelete("DeletePost/{postId}")]
        [Authorize]
        public async Task<IActionResult> DeletePost(Guid postId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (userIdClaim == null)
            {
                return Unauthorized(new ErrorDto
                {
                    Code = "401",
                    Description = "User ID not found in token"
                });
            }

            Guid userId = Guid.Parse(userIdClaim.Value);

            var response = await _blogService.DeletePostAsync(postId, userId);

            if (!response.Status || !response.Data)
            {
                return BadRequest(new ErrorDto
                {
                    Code = "Error",
                    Description = response.Message
                });
            }

            return Ok(new
            {
                Message = "Post deleted successfully",
                Status = true
            });
        }

        [HttpGet]
        [Route("GetAllPostsPublished")]
        public async Task<ActionResult> GetAllPostsPublished([FromQuery] string? query, DateTime? publishAt)
        {
            var categoryResponse = await _blogService.GetAllPostsPublished(query, publishAt);
            return Ok(categoryResponse.Data);
        }

        [HttpPost("upload-image")]
        public async Task<IActionResult> UploadImage(IFormFile image)
        {
            if (image == null || image.Length == 0)
                return BadRequest("No image uploaded.");

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images");

            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var fileName = Guid.NewGuid().ToString() + Path.GetExtension(image.FileName);
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await image.CopyToAsync(stream);
            }

            var imageUrl = $"{Request.Scheme}://{Request.Host}/images/{fileName}";
            return Ok(new { imageUrl });
        }

        [HttpGet("GetRecentPosts")]
        [AllowAnonymous]
        public async Task<ActionResult> GetRecentPosts([FromQuery] int count = 6)
        {
            var response = await _blogService.GetRecentPostsAsync(count);

            if (!response.Status)
            {
                return BadRequest(new ErrorDto
                {
                    Code = "Error",
                    Description = response.Message
                });
            }

            return Ok(response.Data);
        }

        [HttpGet]
        [Route("GetPostsByAuthor/{authorId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPostsByAuthor(Guid authorId)
        {
            var response = await _blogService.GetPostsByAuthorAsync(authorId);

            if (!response.Status)
            {
                return BadRequest(new ErrorDto
                {
                    Code = "Error",
                    Description = response.Message
                });
            }

            return Ok(response.Data);
        }
    }
}