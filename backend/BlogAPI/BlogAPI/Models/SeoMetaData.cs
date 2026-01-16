namespace BlogAPI.Models
{
    public class SeoMetaData
    {
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public string Keywords { get; set; } = "";
        public string CanonicalUrl { get; set; } = "";
        public string ImageUrl { get; set; } = "";
        public string AuthorName { get; set; } = "";
        public DateTime? PublishedDate { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public string PostType { get; set; } = "article"; // article, website, profile
        public string SiteName { get; set; } = "TravelJourney.al";
        public string Locale { get; set; } = "en_US";
    }
}