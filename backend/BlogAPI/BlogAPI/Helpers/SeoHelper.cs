using BlogAPI.Models;
using System.Text.RegularExpressions;

namespace BlogAPI.Helpers
{
    public static class SeoHelper
    {
        public static SeoMetaData GeneratePostSeo(dynamic post, string baseUrl = "http://127.0.0.1:5500")
        {
            var title = GeneratePostTitle(post.Title);
            var description = GenerateDescription(post.Content);
            var keywords = GeneratePostKeywords(post);

            return new SeoMetaData
            {
                Title = title,
                Description = description,
                Keywords = keywords,
                CanonicalUrl = $"{baseUrl}/posts/{post.Guid}",
                ImageUrl = !string.IsNullOrEmpty(post.ImageUrl) ? post.ImageUrl : "",
                AuthorName = GetAuthorName(post),
                PublishedDate = post.CreatedAt,
                ModifiedDate = post.UpdatedAt,
                PostType = "article"
            };
        }

        public static SeoMetaData GenerateCategorySeo(dynamic category, string baseUrl = "http://127.0.0.1:5500")
        {
            var categoryName = category.Name?.ToString() ?? "";
            var title = GenerateCategoryTitle(categoryName);
            var description = GenerateCategoryDescription(categoryName, category.Description);
            var keywords = GenerateCategoryKeywords(categoryName);

            return new SeoMetaData
            {
                Title = title,
                Description = description,
                Keywords = keywords,
                CanonicalUrl = $"{baseUrl}/categories/{category.Id}",
                PostType = "website"
            };
        }

        public static SeoMetaData GenerateAuthorSeo(dynamic author, string baseUrl = "http://127.0.0.1:5500")
        {
            var authorName = GetAuthorFullName(author);
            var title = GenerateAuthorTitle(authorName);
            var description = GenerateAuthorDescription(author);
            var keywords = GenerateAuthorKeywords(authorName, author.Location);

            return new SeoMetaData
            {
                Title = title,
                Description = description,
                Keywords = keywords,
                CanonicalUrl = $"{baseUrl}/authors/{author.Id}",
                ImageUrl = !string.IsNullOrEmpty(author.ProfileImageUrl) ? author.ProfileImageUrl : "",
                AuthorName = authorName,
                PostType = "profile"
            };
        }

        // Helper Methods
        private static string GeneratePostTitle(string postTitle)
        {
            if (string.IsNullOrEmpty(postTitle))
                return "Travel Experience in Albania | TravelJourney.al";

            var cleanTitle = CleanTitle(postTitle);
            return $"{cleanTitle} | Albania Travel Guide | TravelJourney.al";
        }

        private static string GenerateCategoryTitle(string categoryName)
        {
            var formattedCategory = FormatCategoryName(categoryName);
            return $"{formattedCategory} - Explore Albania | TravelJourney.al";
        }

        private static string GenerateAuthorTitle(string authorName)
        {
            if (string.IsNullOrEmpty(authorName))
                return "Travel Author Profile | TravelJourney.al";

            return $"{authorName} - Travel Author & Contributor | TravelJourney.al";
        }

        public static string GenerateDescription(string content)
        {
            if (string.IsNullOrEmpty(content))
                return "Discover authentic travel experiences in Albania with TravelJourney.al. Explore hidden gems, local culture, and unforgettable adventures through real traveler stories.";

            // Remove HTML tags
            var plainText = Regex.Replace(content, "<.*?>", "");

            // Remove extra whitespace
            plainText = Regex.Replace(plainText, @"\s+", " ").Trim();

            // Truncate to 155 characters for optimal SEO
            if (plainText.Length > 155)
            {
                plainText = plainText.Substring(0, 152) + "...";
            }

            return plainText;
        }

        private static string GenerateCategoryDescription(string categoryName, string categoryDescription)
        {
            var formattedCategory = FormatCategoryName(categoryName);

            if (!string.IsNullOrEmpty(categoryDescription))
            {
                var cleanDescription = Regex.Replace(categoryDescription, @"\s+", " ").Trim();
                return $"Explore {formattedCategory} in Albania. {cleanDescription} Discover authentic travel experiences and local insights.";
            }

            return $"Discover amazing {formattedCategory} experiences in Albania. Find authentic travel stories, tips, and insights from real travelers exploring the Balkans.";
        }

        private static string GenerateAuthorDescription(dynamic author)
        {
            var authorName = GetAuthorFullName(author);
            var location = author.Location?.ToString() ?? "";
            var description = author.Description?.ToString() ?? "";

            if (!string.IsNullOrEmpty(description))
            {
                var cleanDescription = Regex.Replace(description, @"\s+", " ").Trim();
                if (cleanDescription.Length > 100)
                {
                    cleanDescription = cleanDescription.Substring(0, 97) + "...";
                }
                return $"Meet {authorName}, travel enthusiast sharing authentic Albanian experiences. {cleanDescription}";
            }

            var locationText = !string.IsNullOrEmpty(location) ? $" from {location}" : "";
            return $"Meet {authorName}{locationText}, a passionate travel writer sharing authentic Albanian travel experiences and local insights.";
        }

        public static string GeneratePostKeywords(dynamic post)
        {
            var keywords = new List<string>
            {
                "Albania travel",
                "travel blog",
                "Albanian destinations",
                "Balkans travel",
                "authentic experiences"
            };

            // Add categories as keywords
            if (post.Categories != null)
            {
                try
                {
                    foreach (var category in post.Categories)
                    {
                        var categoryName = category.Name?.ToString()?.ToLower();
                        if (!string.IsNullOrEmpty(categoryName))
                        {
                            keywords.Add(categoryName.Replace("-", " "));

                            // Add specific keywords based on category
                            keywords.AddRange(GetCategorySpecificKeywords(categoryName));
                        }
                    }
                }
                catch
                {
                    // Continue if categories parsing fails
                }
            }

            // Add location-based keywords
            keywords.AddRange(new[] { "Southeast Europe", "Mediterranean travel", "European destinations" });

            return string.Join(", ", keywords.Distinct().Take(15));
        }

        private static string GenerateCategoryKeywords(string categoryName)
        {
            var keywords = new List<string>
            {
                "Albania travel",
                "Albanian tourism",
                "Balkans travel"
            };

            var formattedCategory = FormatCategoryName(categoryName);
            keywords.Add(formattedCategory.ToLower());
            keywords.AddRange(GetCategorySpecificKeywords(categoryName));

            return string.Join(", ", keywords.Distinct().Take(10));
        }

        private static string GenerateAuthorKeywords(string authorName, string location)
        {
            var keywords = new List<string>
            {
                "travel author",
                "Albania travel writer",
                "travel blogger",
                "Albanian travel expert"
            };

            if (!string.IsNullOrEmpty(location))
            {
                keywords.Add($"travel guide {location}");
            }

            return string.Join(", ", keywords);
        }

        private static string GetAuthorName(dynamic post)
        {
            try
            {
                if (post.Author != null)
                {
                    var firstName = post.Author.FirstName?.ToString() ?? "";
                    var lastName = post.Author.LastName?.ToString() ?? "";
                    return $"{firstName} {lastName}".Trim();
                }

                if (post.AuthorName != null)
                {
                    return post.AuthorName.ToString();
                }
            }
            catch
            {
                // Continue if author parsing fails
            }

            return "TravelJourney Author";
        }

        private static string GetAuthorFullName(dynamic author)
        {
            try
            {
                var firstName = author.FirstName?.ToString() ?? "";
                var lastName = author.LastName?.ToString() ?? "";
                var fullName = $"{firstName} {lastName}".Trim();

                return string.IsNullOrEmpty(fullName) ? "Travel Enthusiast" : fullName;
            }
            catch
            {
                return "Travel Enthusiast";
            }
        }

        private static string CleanTitle(string title)
        {
            // Remove extra whitespace and special characters
            return Regex.Replace(title, @"[^\w\s-]", "").Trim();
        }

        private static string FormatCategoryName(string categoryName)
        {
            if (string.IsNullOrEmpty(categoryName)) return "Travel Experiences";

            // Convert category names to user-friendly format
            return categoryName switch
            {
                "adventure-chronicles" => "Adventure Chronicles",
                "culture-code" => "Cultural Experiences",
                "discover-cities" => "City Discoveries",
                "hidden-gems" => "Hidden Gems",
                "local-wisdom" => "Local Wisdom",
                "night-owl-guides" => "Nightlife Guides",
                "smart-traveler-guide" => "Smart Travel Tips",
                "taste-toast" => "Food & Dining",
                _ => categoryName.Replace("-", " ").Replace("_", " ")
                    .Split(' ')
                    .Select(word => char.ToUpper(word[0]) + word.Substring(1).ToLower())
                    .Aggregate((current, next) => current + " " + next)
            };
        }

        private static IEnumerable<string> GetCategorySpecificKeywords(string categoryName)
        {
            return categoryName.ToLower() switch
            {
                "adventure-chronicles" => new[] { "adventure travel", "hiking Albania", "outdoor activities", "Albanian Alps" },
                "culture-code" => new[] { "Albanian culture", "cultural heritage", "traditional Albania", "local customs" },
                "discover-cities" => new[] { "Albanian cities", "urban exploration", "city guide Albania", "Tirana", "Berat" },
                "hidden-gems" => new[] { "off the beaten path", "secret places Albania", "undiscovered Albania" },
                "local-wisdom" => new[] { "local tips", "insider knowledge", "Albanian traditions", "local guides" },
                "night-owl-guides" => new[] { "nightlife Albania", "bars restaurants", "evening entertainment" },
                "smart-traveler-guide" => new[] { "travel tips Albania", "travel planning", "budget travel" },
                "taste-toast" => new[] { "Albanian cuisine", "local food", "restaurants Albania", "traditional dishes" },
                _ => new[] { "Albania experiences" }
            };
        }
    }
}