using System.ComponentModel.DataAnnotations;

namespace BlogAPI.Dtos.User;

public class UpdateProfileDto
{
    [MaxLength(50)]
    public string FirstName { get; set; }

    [MaxLength(50)]
    public string LastName { get; set; }

    [MaxLength(500)]
    public string Description { get; set; }

    public string Location { get; set; }
    public string ProfileImageUrl { get; set; }
}