using DAL.Entity;
using DAL.Enums;
using DAL.ENums;
using System.ComponentModel.DataAnnotations;

namespace DAL.Entity;

public class Post
{
    [Key]
    public Guid Guid { get; set; }
    [Required]
    [MaxLength(100)]
    public string Title { get; set; }
    public string? Content { get; set; }
    [Required]
    public DateTime CreatedAt { get; set; }
    [Required]
    public DateTime PublishAt { get; set; }
    [Required]
    public DateTime UpdatedAt { get; set; }
    [Required]
    public Guid UserId { get; set; }
    public User User { get; set; }
    [Required]
    public PostStatus Status { get; set; }
    public ICollection<PostCategory> PostCategories { get; set; }
    public string? ImageUrl { get; set; }
}