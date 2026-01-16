using DAL.Entity;
using DAL.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL.Repositories;

public class CategoryRepository : Repository <Category>, ICategoryRepository
{
    public CategoryRepository(BlogContext context) : base(context)
    {

    }
}
