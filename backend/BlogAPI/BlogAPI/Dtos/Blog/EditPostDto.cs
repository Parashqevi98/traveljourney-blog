using BlogAPI.Helpers;
using DAL.ENums;
using System.ComponentModel.DataAnnotations;

namespace BlogAPI.Dtos.Blog;
public class EditPostDto
{
    [Required]
    public Guid Id { get; set; }
    [Required]
    [MaxLength(100)]
    public string Title { get; set; }
    public string? Content { get; set; }
    [Required]
    public DateTime PublishAt { get; set; }
    [Required]
    [ValidPostStatus]
    public PostStatus Status { get; set; }
    public IEnumerable<Guid>? Categories { get; set; }
    public string? ImageUrl { get; set; }
}