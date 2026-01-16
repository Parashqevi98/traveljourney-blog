# TravelJourney Blog

TravelJourney is a fullstack travel blog platform designed to share and explore tourist experiences.  
The project follows modern software architecture principles, with a clear separation between frontend and backend, enabling high performance, modularity, maintainability, and future scalability.

## Tech Stack

### Backend
- **Language:** C#  
- **Framework:** .NET 6.0 / ASP.NET Core Web API  
- **ORM:** Entity Framework Core (Code First)  
- **Patterns:** Repository Pattern, Unit of Work Pattern  
- **API Documentation:** Swagger (OpenAPI Specification)

### Frontend
- **Languages:** HTML5, CSS3, JavaScript  
- **HTTP Requests:** Fetch API  
- **Responsive Design:** Works on all device types

### Database
- **DBMS:** Microsoft SQL Server  
- **Schema Management:** EF Core Code First with Migrations  

---

## Project Structure

traveljourney-blog/
│
├── backend/BlogAPI/ # Backend API and business logic
├── frontend/TravelJourney/ # Frontend user interface
├── README.md
└── .gitignore

## Features
- Users can view and post travel experiences (demo content)
- Fullstack separation allows independent development of frontend and backend
- RESTful API for scalable and modular communication
- Automated API documentation via Swagger
- Clean architecture ensuring maintainable and testable code
- Secure and performant database operations using EF Core

---

## Architecture

### Backend: Three-layer Architecture
The backend is built on a **three-layer architecture** (API Layer, BLL, DAL), providing:

1. **Separation of Concerns** – each layer has clear responsibilities.  
2. **Testability** – allows unit testing for each component.  
3. **Maintainability** – easy to extend and update independently.  

#### Data Flow Example (Creating a new post)
1. **API Layer:** `BlogController` receives `PostDto` from frontend and validates it.  
2. **Business Logic Layer (BLL):** `BlogService` transforms DTO into domain model and applies business rules.  
3. **Data Access Layer (DAL):** `PostRepository` stores the entity in the database via EF Core.  
4. **Response:** Returns `ServiceResponse<PostResponse>` to frontend with transformed data.

This ensures that each layer communicates only through well-defined interfaces, following **Clean Architecture principles**.

---

## Database

- SQL Server is used for its high performance, advanced security, and strong integration with .NET.  
- Schema is generated via **EF Core Code First**.  
- Migrations track changes in the database schema and ensure synchronization with domain models.  

---

## Screenshots

**Frontend Example:**
<img width="1920" height="7929" alt="image" src="https://github.com/user-attachments/assets/2221784c-3f78-4e68-bbcf-9b15514d10b9" />
<img width="1920" height="4519" alt="image" src="https://github.com/user-attachments/assets/90e5dbbe-c367-4b2d-9b55-ce3c9b692103" />
<img width="1920" height="4228" alt="image" src="https://github.com/user-attachments/assets/e70bd153-2f39-4363-a3be-9876bdd7a21c" />
<img width="1920" height="3919" alt="image" src="https://github.com/user-attachments/assets/9b8f9c55-dc00-4b3d-9dd0-fd18311e8e59" />
<img width="1920" height="3924" alt="image" src="https://github.com/user-attachments/assets/0f6dd048-8e8c-44d6-b604-11b8e8166b4c" />
<img width="1920" height="4518" alt="image" src="https://github.com/user-attachments/assets/2a00e255-8238-4769-8d93-f1adeeee8407" />

**Backend Example (Swagger):**
<img width="1920" height="4587" alt="image" src="https://github.com/user-attachments/assets/8a88957d-11b6-4729-af33-7826b12199b5" />


---
