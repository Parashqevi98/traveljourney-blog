// BlogAPI/Dtos/User/RegisterDto.cs
using System.ComponentModel.DataAnnotations;
namespace BlogAPI.Dtos.User;
public class RegisterDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; }
    [Required]
    public string Password { get; set; }
    [Required]
    [MaxLength(50)]
    public string FirstName { get; set; }
    [Required]
    [MaxLength(50)]
    public string LastName { get; set; }

    // Fushat e reja, por opsionale për përdoruesin
    [MaxLength(500)]
    public string? Description { get; set; }
    public string? ProfileImageUrl { get; set; }
    public string? Location { get; set; }
}