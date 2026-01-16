using BlogAPI.Dtos.Blog;
using DAL.Entity;

namespace BlogAPI.Dtos.User
{
    public class AuthorProfileWithPostsDto
    {
        public Guid Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string Description { get; set; }
        public string ProfileImageUrl { get; set; }
        public string Location { get; set; }
        public DateTime? JoinedDate { get; set; }
        public List<Post> Posts { get; set; } = new List<Post>();   // Lista e postimeve të autorit
    }
}
