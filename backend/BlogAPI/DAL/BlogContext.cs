using DAL.Entity;
using DAL.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace DAL;

public class BlogContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
{
    public DbSet<Post> Posts { get; set; }
    public DbSet<Category> Category { get; set; }
    public DbSet<PostCategory> PostCategory { get; set; }
    public DbSet<RefreshTokens> RefreshTokens { get; set; }

    public BlogContext(DbContextOptions<BlogContext> options)
        : base(options)
    {
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.ConfigureWarnings(warnings =>
            warnings.Ignore(RelationalEventId.PendingModelChangesWarning));
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        Guid ADMIN_ID = Guid.Parse("e4f1a6b3-1d6f-4424-a817-ea78db2e760f");
        Guid USER_ID = Guid.Parse("fce796d1-7c09-4299-bb2a-6a9ccfa39390");
        Guid USER_ADMIN_ID = Guid.Parse("90c50356-919f-4270-9cb4-6b3ea5dc4c64");

        modelBuilder.Entity<IdentityRole<Guid>>().HasData(
            new IdentityRole<Guid>
            {
                Id = ADMIN_ID,
                Name = Role.Admin.ToString(),
                NormalizedName = Role.Admin.ToString().ToUpper(),
                ConcurrencyStamp = ADMIN_ID.ToString()
            },
            new IdentityRole<Guid>
            {
                Id = USER_ID,
                Name = Role.User.ToString(),
                NormalizedName = Role.User.ToString().ToUpper(),
                ConcurrencyStamp = USER_ID.ToString()
            }
        );

        var hasher = new PasswordHasher<User>();
        var admin = new User
        {
            Id = USER_ADMIN_ID,
            UserName = "eldaa.cela10@gmail.com",
            Email = "eldaa.cela10@gmail.com",
            FirstName = "Elda",
            LastName = "Cela",
            EmailConfirmed = true,
            PhoneNumberConfirmed = true,
            NormalizedEmail = "ELDAA.CELA10@GMAIL.COM",
            NormalizedUserName = "ELDAA.CELA10@GMAIL.COM",
            ConcurrencyStamp = USER_ADMIN_ID.ToString(),
            SecurityStamp = USER_ADMIN_ID.ToString(),
            PasswordHash = hasher.HashPassword(null, "User123.")
        };

        modelBuilder.Entity<User>().HasData(admin);

        modelBuilder.Entity<IdentityUserRole<Guid>>().HasData(
            new IdentityUserRole<Guid>
            {
                RoleId = ADMIN_ID,
                UserId = USER_ADMIN_ID
            }
        );

        modelBuilder.Entity<PostCategory>().HasKey(nc => new { nc.PostGuid, nc.CategoryGuid });

        modelBuilder.Entity<PostCategory>()
            .HasOne(pc => pc.Post)
            .WithMany(p => p.PostCategories)
            .HasForeignKey(pc => pc.PostGuid);

        modelBuilder.Entity<PostCategory>()
            .HasOne(pc => pc.Category)
            .WithMany(c => c.PostCategories)
            .HasForeignKey(pc => pc.CategoryGuid);

        modelBuilder.Entity<Category>()
            .Property(c => c.Name)
            .HasMaxLength(100)
            .IsRequired();

        modelBuilder.Entity<Post>()
            .Property(n => n.Title)
            .HasMaxLength(100)
            .IsRequired();

        modelBuilder.Entity<Post>()
            .Property(n => n.CreatedAt)
            .HasDefaultValue(new DateTime(2024, 1, 1)) // Zëvendëson DateTime.Now
            .IsRequired();

        modelBuilder.Entity<Post>()
            .Property(n => n.UpdatedAt)
            .HasDefaultValue(new DateTime(2024, 1, 1)) // Zëvendëson DateTime.Now
            .IsRequired();

        modelBuilder.Entity<RefreshTokens>()
            .HasOne(us => us.User)
            .WithMany(au => au.RefreshTokens)
            .HasForeignKey(us => us.UserId);
    }
}