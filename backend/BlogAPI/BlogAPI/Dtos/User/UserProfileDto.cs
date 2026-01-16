using System.ComponentModel.DataAnnotations;

namespace BlogAPI.Dtos.User;

public class UserProfileDto
{
    public Guid Id { get; set; }
    [MaxLength(50)]
    public string FirstName { get; set; }

    [MaxLength(50)]
    public string LastName { get; set; }

    [EmailAddress]
    public string Email { get; set; }

    [MaxLength(500)]
    public string Description { get; set; }

    public string ProfileImageUrl { get; set; }

    public string Location { get; set; }

    public DateTime? JoinedDate { get; set; }
}

