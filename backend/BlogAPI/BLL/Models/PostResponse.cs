namespace BLL.Models;

public class PostResponse
{
    public Guid Guid { get; set; }
    public string Title { get; set; }
    public string? Content { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime PublishAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid UserId { get; set; }
    public string? UserName { get; set; }
    public string Status { get; set; }
    public IEnumerable<CategoryResponse> Categories { get; set; }
    public string? ImageUrl { get; set; }
}