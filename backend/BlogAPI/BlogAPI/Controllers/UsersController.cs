using BLL.IService;
using BLL.Services;
using BlogAPI.Dtos.Blog;
using BlogAPI.Dtos.User;
using BlogAPI.Helpers;
using BlogAPI.Models;
using DAL.Entity;
using DAL.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient.Server;
using System.Security.Claims;

namespace BlogAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly IUserService _userService;
    private readonly IBlogService _blogService;
    private readonly string _baseUrl;

    public UsersController(
         UserManager<User> userManager,
         IUserService userService,
         IBlogService blogService,
         IConfiguration configuration)
    {
        _userManager = userManager;
        _userService = userService;
        _blogService = blogService;
        _baseUrl = configuration["BaseUrl"] ?? "http://127.0.0.1:5500";
    }

    // ============ SEO ENDPOINTS ============
    [HttpGet("seo/author/{userId}")]
    [AllowAnonymous]
    public async Task<ActionResult<SeoMetaData>> GetAuthorSeoData(Guid userId)
    {
        var userResponse = await _userService.GetUserProfileAsync(userId);
        if (!userResponse.Status || userResponse.Data == null)
        {
            return NotFound(new ErrorDto
            {
                Code = "AuthorNotFound",
                Description = "Author not found for SEO data"
            });
        }

        var seoData = SeoHelper.GenerateAuthorSeo(userResponse.Data, _baseUrl);
        return Ok(seoData);
    }

    [HttpGet("seo/authors")]
    [AllowAnonymous]
    public ActionResult<SeoMetaData> GetAuthorsPageSeoData()
    {
        var seoData = new SeoMetaData
        {
            Title = "Travel Authors & Contributors - Albanian Travel Community | TravelJourney.al",
            Description = "Meet our community of travel enthusiasts and authors sharing authentic Albanian travel experiences. Discover stories from local experts, passionate travelers, and adventure seekers exploring the Balkans.",
            Keywords = "travel authors Albania, travel bloggers Balkans, Albanian travel writers, travel contributors, local guides Albania, travel community Southeast Europe",
            CanonicalUrl = $"{_baseUrl}/authors"
        };

        return Ok(seoData);
    }

    // ============ ORIGINAL ENDPOINTS ============

    [HttpPost]
    [Route("login")]
    public async Task<ActionResult> Login([FromBody] LoginDto model)
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

        var user = await _userManager.FindByEmailAsync(model.Email);

        if (user == null)
        {
            var error = new ErrorDto
            {
                Code = "UserDoesNotExist",
                Description = "User does not exist."
            };
            return NotFound(error);
        }

        if (!await _userManager.CheckPasswordAsync(user, model.Password))
        {
            var error = new ErrorDto
            {
                Code = "IncorrectPassword",
                Description = "Incorrect Password!"
            };
            return Unauthorized(error);
        }

        var userRoles = await _userManager.GetRolesAsync(user);
        var accessTokenResponse = _userService.GenerateAccessToken(model.Email, userRoles.FirstOrDefault(), user.Id);

        var refreshTokenResponse = _userService.GenerateRefreshToken();

        var refeshTokenEntity = new RefreshTokens
        {
            UserId = user.Id,
            RefreshToken = refreshTokenResponse.RefreshToken,
            RefreshTokenExpiryTime = refreshTokenResponse.RefreshTokenExpiryTime
        };

        var insertRefreshTokenResponse = await _userService.AddRefreshTokens(refeshTokenEntity);

        if (!insertRefreshTokenResponse.Status)
        {
            var error = new ErrorDto
            {
                Code = "RefreshTokenNotSaved",
                Description = insertRefreshTokenResponse.Message
            };
            return BadRequest(error);
        }

        var tokens = new TokenDto
        {
            AccessToken = accessTokenResponse.AccessToken,
            AccessTokenExpiryTime = accessTokenResponse.AccessTokenExpiryTime,
            RefreshToken = refreshTokenResponse.RefreshToken,
            RefreshTokenExpiryTime = refreshTokenResponse.RefreshTokenExpiryTime
        };

        return Ok(tokens);
    }

    [HttpPost]
    [Route("refresh-token")]
    public async Task<ActionResult> RefreshToken([FromBody] RefreshTokenDto model)
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

        var tokenResponse = await _userService.RefreshAccessToken(model.RefreshToken);

        if (!tokenResponse.Status)
        {
            var error = new ErrorDto
            {
                Code = "Error",
                Description = tokenResponse.Message
            };
            return BadRequest(error);
        }

        var tokens = new TokenDto
        {
            AccessToken = tokenResponse.Data.AccessToken.AccessToken,
            AccessTokenExpiryTime = tokenResponse.Data.AccessToken.AccessTokenExpiryTime,
            RefreshToken = tokenResponse.Data.RefreshToken.RefreshToken,
            RefreshTokenExpiryTime = tokenResponse.Data.RefreshToken.RefreshTokenExpiryTime
        };

        return Ok(tokens);
    }

    [HttpPost]
    [Route("register")]
    public async Task<ActionResult> Register([FromBody] RegisterDto model)
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

        var user = await _userManager.FindByEmailAsync(model.Email);

        if (user != null)
        {
            var error = new ErrorDto
            {
                Code = "UserExists",
                Description = "A user with this email already exists."
            };
            return BadRequest(error);
        }

        var newUser = new User
        {
            UserName = model.Email,
            NormalizedUserName = model.Email.ToUpper(),
            Email = model.Email,
            NormalizedEmail = model.Email.ToUpper(),
            FirstName = model.FirstName.ToLower(),
            LastName = model.LastName.ToLower(),
            JoinedDate = DateTime.UtcNow,
            Description = model.Description ?? "",
            ProfileImageUrl = model.ProfileImageUrl ?? "",
            Location = model.Location ?? ""
        };

        var result = await _userManager.CreateAsync(newUser, model.Password);

        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => new ErrorDto
            {
                Code = e.Code,
                Description = e.Description
            }).ToList();

            return BadRequest(errors);
        }

        await _userManager.AddToRoleAsync(newUser, Role.User.ToString());

        return Ok(new
        {
            Message = "User registered successfully",
            Email = newUser.Email
        });
    }

    [HttpGet]
    [Route("my-profile-with-posts")]
    [Authorize]
    public async Task<ActionResult> GetMyProfileWithPosts()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null)
        {
            return Unauthorized(new ErrorDto
            {
                Code = "Unauthorized",
                Description = "User not authenticated"
            });
        }

        var userId = Guid.Parse(userIdClaim);

        var userResponse = await _userService.GetUserProfileAsync(userId);

        if (!userResponse.Status)
        {
            return NotFound(new ErrorDto
            {
                Code = "NotFound",
                Description = userResponse.Message
            });
        }

        var postsResponse = await _blogService.GetPostsByAuthorAsync(userId);

        var user = userResponse.Data;
        var profile = new AuthorProfileWithPostsDto
        {
            Id = userId,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            Description = user.Description,
            ProfileImageUrl = user.ProfileImageUrl,
            Location = user.Location,
            JoinedDate = user.JoinedDate ?? DateTime.UtcNow,
            Posts = postsResponse.Status ? postsResponse.Data : new List<Post>()
        };

        return Ok(profile);
    }

    [HttpPut]
    [Route("update-my-profile")]
    [Authorize]
    public async Task<ActionResult> UpdateMyProfile([FromBody] UpdateProfileDto model)
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
        if (userIdClaim == null)
        {
            return Unauthorized(new ErrorDto
            {
                Code = "Unauthorized",
                Description = "User not authenticated"
            });
        }

        var userId = Guid.Parse(userIdClaim);

        var updatedUser = new User
        {
            FirstName = model.FirstName,
            LastName = model.LastName,
            Description = model.Description,
            Location = model.Location,
            ProfileImageUrl = model.ProfileImageUrl
        };

        var userResponse = await _userService.UpdateUserProfileAsync(userId, updatedUser);

        if (!userResponse.Status)
        {
            return BadRequest(new ErrorDto
            {
                Code = "Error",
                Description = userResponse.Message
            });
        }

        return Ok(new
        {
            Message = "Profile updated successfully"
        });
    }

    [HttpPost]
    [Route("upload-profile-image")]
    public async Task<IActionResult> UploadProfileImage(IFormFile image)
    {
        if (image == null || image.Length == 0)
            return BadRequest("No image uploaded.");

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null)
            return Unauthorized("User not authenticated");

        var userId = Guid.Parse(userIdClaim);

        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "profile-images");

        if (!Directory.Exists(uploadsFolder))
            Directory.CreateDirectory(uploadsFolder);

        var fileName = Guid.NewGuid().ToString() + Path.GetExtension(image.FileName);
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await image.CopyToAsync(stream);
        }

        var imageUrl = $"{Request.Scheme}://{Request.Host}/profile-images/{fileName}";

        var updateResponse = await _userService.UpdateProfileImageAsync(userId, imageUrl);

        if (!updateResponse.Status)
            return BadRequest(updateResponse.Message);

        return Ok(new { imageUrl });
    }

    [HttpGet]
    [Route("author-profile/{userId}")]
    [AllowAnonymous]
    public async Task<ActionResult> GetAuthorProfile(Guid userId)
    {
        if (userId == Guid.Empty)
        {
            return BadRequest(new ErrorDto
            {
                Code = "InvalidUserId",
                Description = "Invalid user ID provided."
            });
        }

        var userResponse = await _userService.GetUserProfileAsync(userId);

        if (!userResponse.Status)
        {
            return NotFound(new ErrorDto
            {
                Code = "NotFound",
                Description = userResponse.Message
            });
        }

        var user = userResponse.Data;
        var profile = new UserProfileDto
        {
            Id = userId,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Description = user.Description,
            ProfileImageUrl = user.ProfileImageUrl,
            Location = user.Location,
            JoinedDate = user.JoinedDate
        };

        return Ok(profile);
    }
}