using System.ComponentModel.DataAnnotations;

namespace BlogAPI.Dtos.Blog;
public class CategoryDto
{
    [Required]
    [MaxLength(100)]
    public string CategoryName { get; set; }
    [Required]
    public string CategoryDescription { get; set; }
}