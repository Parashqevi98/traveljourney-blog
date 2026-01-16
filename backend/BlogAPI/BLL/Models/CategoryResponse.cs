namespace BLL.Models;

public class CategoryResponse
{
    public Guid Id { get; set; } // Shtohet fusha Id
    public string Name { get; set; } // Shtohet fusha Name
    public string Description { get; set; } // Shtohet fusha Description
    public string CategoryName { get; set; } // Fusha ekzistuese
}
