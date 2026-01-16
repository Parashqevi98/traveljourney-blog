using BLL.IService;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Xml;

namespace BlogAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class SitemapController : ControllerBase
    {
        private readonly IBlogService _blogService;
        private readonly IUserService _userService;
        private readonly string _baseUrl;

        public SitemapController(IBlogService blogService, IUserService userService, IConfiguration configuration)
        {
            _blogService = blogService;
            _userService = userService;
            _baseUrl = configuration["BaseUrl"] ?? "http://127.0.0.1:5500";
        }

        [HttpGet("sitemap.xml")]
        [Produces("application/xml")]
        public async Task<IActionResult> GetSitemap()
        {
            try
            {
                var sitemap = await GenerateSitemap();
                return Content(sitemap, "application/xml; charset=utf-8");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error generating sitemap: {ex.Message}");
                return StatusCode(500, "Error generating sitemap");
            }
        }

        [HttpGet("robots.txt")]
        [Produces("text/plain")]
        public IActionResult GetRobotsTxt()
        {
            var robots = GenerateRobotsTxt();
            return Content(robots, "text/plain");
        }

        private async Task<string> GenerateSitemap()
        {
            var xml = new StringBuilder();
            xml.AppendLine("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
            xml.AppendLine("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");

            // Static pages
            AddStaticPages(xml);

            // Blog posts
            await AddBlogPosts(xml);

            // Categories
            await AddCategories(xml);

            // Authors (optional)
            // await AddAuthors(xml);

            xml.AppendLine("</urlset>");
            return xml.ToString();
        }

        private void AddStaticPages(StringBuilder xml)
        {
            var staticPages = new[]
            {
                new { Url = "", Priority = "1.0", ChangeFreq = "daily" }, // Homepage
                new { Url = "/posts", Priority = "0.9", ChangeFreq = "daily" },
                new { Url = "/categories", Priority = "0.8", ChangeFreq = "weekly" },
                new { Url = "/about", Priority = "0.7", ChangeFreq = "monthly" },
                new { Url = "/authors", Priority = "0.6", ChangeFreq = "weekly" }
            };

            foreach (var page in staticPages)
            {
                xml.AppendLine("  <url>");
                xml.AppendLine($"    <loc>{_baseUrl}{page.Url}</loc>");
                xml.AppendLine($"    <lastmod>{DateTime.UtcNow:yyyy-MM-dd}</lastmod>");
                xml.AppendLine($"    <changefreq>{page.ChangeFreq}</changefreq>");
                xml.AppendLine($"    <priority>{page.Priority}</priority>");
                xml.AppendLine("  </url>");
            }
        }

        private async Task AddBlogPosts(StringBuilder xml)
        {
            try
            {
                var postsResponse = await _blogService.GetAllPostsPublished(null, null);

                if (postsResponse.Status && postsResponse.Data != null)
                {
                    foreach (var post in postsResponse.Data)
                    {
                        xml.AppendLine("  <url>");
                        xml.AppendLine($"    <loc>{_baseUrl}/posts/{post.Guid}</loc>");
                        xml.AppendLine($"    <lastmod>{post.UpdatedAt:yyyy-MM-dd}</lastmod>");
                        xml.AppendLine("    <changefreq>monthly</changefreq>");
                        xml.AppendLine("    <priority>0.8</priority>");

                        // Add image if exists
                        if (!string.IsNullOrEmpty(post.ImageUrl))
                        {
                            xml.AppendLine("    <image:image xmlns:image=\"http://www.google.com/schemas/sitemap-image/1.1\">");
                            xml.AppendLine($"      <image:loc>{post.ImageUrl}</image:loc>");
                            xml.AppendLine($"      <image:title>{EscapeXml(post.Title)}</image:title>");
                            xml.AppendLine("    </image:image>");
                        }

                        xml.AppendLine("  </url>");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error adding blog posts to sitemap: {ex.Message}");
            }
        }

        private async Task AddCategories(StringBuilder xml)
        {
            try
            {
                var categoriesResponse = await _blogService.GetAllCategoriesAsync();

                if (categoriesResponse.Status && categoriesResponse.Data != null)
                {
                    foreach (var category in categoriesResponse.Data)
                    {
                        xml.AppendLine("  <url>");
                        xml.AppendLine($"    <loc>{_baseUrl}/categories/{category.Id}</loc>");
                        xml.AppendLine($"    <lastmod>{DateTime.UtcNow:yyyy-MM-dd}</lastmod>");
                        xml.AppendLine("    <changefreq>weekly</changefreq>");
                        xml.AppendLine("    <priority>0.7</priority>");
                        xml.AppendLine("  </url>");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error adding categories to sitemap: {ex.Message}");
            }
        }

        private string GenerateRobotsTxt()
        {
            var robots = new StringBuilder();
            robots.AppendLine("User-agent: *");
            robots.AppendLine("Allow: /");
            robots.AppendLine("");
            robots.AppendLine("# Disallow admin and private areas");
            robots.AppendLine("Disallow: /admin/");
            robots.AppendLine("Disallow: /api/");
            robots.AppendLine("Disallow: /profile/");
            robots.AppendLine("Disallow: /login");
            robots.AppendLine("Disallow: /register");
            robots.AppendLine("");
            robots.AppendLine("# Sitemap location");
            robots.AppendLine($"Sitemap: {_baseUrl}/sitemap/sitemap.xml");
            robots.AppendLine("");
            robots.AppendLine("# Crawl-delay (optional)");
            robots.AppendLine("Crawl-delay: 1");

            return robots.ToString();
        }

        private static string EscapeXml(string input)
        {
            if (string.IsNullOrEmpty(input))
                return input;

            return input
                .Replace("&", "&amp;")
                .Replace("<", "&lt;")
                .Replace(">", "&gt;")
                .Replace("\"", "&quot;")
                .Replace("'", "&#39;");
        }
    }
}