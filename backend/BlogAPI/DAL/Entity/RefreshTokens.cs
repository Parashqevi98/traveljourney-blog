using DAL.Entity;
using System.ComponentModel.DataAnnotations;

namespace DAL.Entity;
public class RefreshTokens
{
    [Key]
    public Guid Id { get; set; }
    [Required]
    public Guid UserId { get; set; }
    public User User { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime RefreshTokenExpiryTime { get; set; }
}