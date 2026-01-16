// DAL/Entity/User.cs
using DAL.Entity;
using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace DAL.Entity;

public class User : IdentityUser<Guid>
{
    [MaxLength(50)]
    public string FirstName { get; set; }
    [MaxLength(50)]
    public string LastName { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; } // Shtojmë ? për ta bërë nullable/opsionale
    public string? ProfileImageUrl { get; set; } // Shtojmë ? për ta bërë nullable/opsionale
    public string? Location { get; set; } // Shtojmë ? për ta bërë nullable/opsionale
    public DateTime? JoinedDate { get; set; }

    public ICollection<RefreshTokens>? RefreshTokens { get; set; }
}