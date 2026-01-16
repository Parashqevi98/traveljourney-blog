document.addEventListener("DOMContentLoaded", () => {
  // Kontrollon nëse është tashmë i loguar
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) {
    window.location.href = "index.html";
    return;
  }

  // Përditëson navbar
  updateNavbar();
  
  // Ngarkon kategoritë për dropdown
  loadCategories();
  
  // Konfiguron menunë mobile - E NJËJTA SI POSTS.HTML
  setupMobileMenu();
  
  // Trajtimi i formës së login-it
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const errorElement = document.getElementById("error");
      
      if (errorElement) {
        errorElement.textContent = "";
        errorElement.classList.remove("show");
      }
      
      if (!email || !password) {
        if (errorElement) {
          errorElement.textContent = "Ju lutemi plotësoni të gjitha fushat";
          errorElement.classList.add("show");
        }
        return;
      }
      
      try {
        const response = await fetch("https://localhost:7059/api/Users/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (errorElement) {
            errorElement.textContent = errorData.message || "Email ose fjalëkalim i pavlefshëm. Ju lutemi provoni përsëri.";
            errorElement.classList.add("show");
          }
          return;
        }
        
        const data = await response.json();
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        sessionStorage.setItem("justLoggedIn", "true");
        
        if (sessionStorage.getItem("redirectAfterLogin")) {
          window.location.href = sessionStorage.getItem("redirectAfterLogin");
          sessionStorage.removeItem("redirectAfterLogin");
        } else {
          window.location.href = "index.html";
        }
      } catch (err) {
        if (errorElement) {
          errorElement.textContent = "Gabim në rrjet. Ju lutemi provoni përsëri më vonë.";
          errorElement.classList.add("show");
        }
      }
    });
  }
});

// Funksioni për të ngarkuar kategoritë - KOPJUAR NGA POSTS.HTML
function loadCategories() {
  // Kontrollon nëse jemi në modalitetin e zhvillimit ose nëse API është e disponueshme
  if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
    // Përpiqet të ngarkojë kategoritë, por dështon në heshtje nëse API nuk po funksionon
    fetch('https://localhost:7059/api/Blog/GetAllCategories')
      .then(response => {
        if (!response.ok) {
          throw new Error('API nuk është e disponueshme');
        }
        return response.json();
      })
      .then(categories => {
        const categoryList = document.getElementById('categoryList');
        if (categoryList && categories.length > 0) {
          categoryList.innerHTML = '';
          categories.forEach(category => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `posts.html?category=${category.id}`;
            a.textContent = category.name;
            li.appendChild(a);
            categoryList.appendChild(li);
          });
        }
      })
      .catch(error => {
        // Dështon në heshtje - vetëm shton disa kategori të parazgjedhura për demo
        console.log('API nuk është e disponueshme, duke përdorur kategoritë e parazgjedhura');
        const categoryList = document.getElementById('categoryList');
        if (categoryList) {
          const defaultCategories = [
            { id: '1', name: 'Aventurë' },
            { id: '2', name: 'Kulturë' },
            { id: '3', name: 'Ushqim & Pije' },
            { id: '4', name: 'Natyrë' },
            { id: '5', name: 'Ture Qyteti' }
          ];
          
          categoryList.innerHTML = '';
          defaultCategories.forEach(category => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `posts.html?category=${category.id}`;
            a.textContent = category.name;
            li.appendChild(a);
            categoryList.appendChild(li);
          });
        }
      });
  } else {
    // Në prodhim, shton kategori të parazgjedhura ose le bosh
    console.log('Modaliteti i prodhimit - kategoritë do të ngarkohen nga serveri');
  }
}

// Funksioni për të përditësuar navbar bazuar në statusin e login-it
function updateNavbar() {
  const loginLogoutBtn = document.getElementById("loginLogoutBtn");
  const registerItem = document.getElementById("registerItem");
  
  if (loginLogoutBtn) {
    const isLoggedIn = localStorage.getItem("accessToken") !== null;
    
    if (isLoggedIn) {
      loginLogoutBtn.textContent = "Logout";
      loginLogoutBtn.href = "#";
      
      if (registerItem) registerItem.style.display = "none";
      
      const newBtn = loginLogoutBtn.cloneNode(true);
      loginLogoutBtn.parentNode.replaceChild(newBtn, loginLogoutBtn);
      
      document.getElementById("loginLogoutBtn").addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userProfile");
        window.location.href = "index.html";
      });
    } else {
      loginLogoutBtn.textContent = "Login";
      loginLogoutBtn.href = "login.html";
      
      if (registerItem) registerItem.style.display = "list-item";
      
      const newBtn = loginLogoutBtn.cloneNode(true);
      loginLogoutBtn.parentNode.replaceChild(newBtn, loginLogoutBtn);
    }
  }
}

// Ndryshon menunë mobile - PLOTËSISHT E NJËJTA SI INDEX.HTML
function setupMobileMenu() {
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileMenuToggle && navLinks) {
    mobileMenuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
    
    // Mbyll menunë kur klikohet jashtë
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !mobileMenuToggle.contains(e.target) && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
      }
    });
  }
  
  // Trajton dropdown në pamjen mobile - PLOTËSISHT E NJËJTA SI INDEX.HTML
  const dropdowns = document.querySelectorAll('.dropdown');
  dropdowns.forEach(dropdown => {
    const link = dropdown.querySelector('a');
    if (link) {
      link.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          dropdown.classList.toggle('active');
        }
      });
    }
  });
}

// Thërret setupMobileMenu përsëri pasi gjithçka është ngarkuar plotësisht - E NJËJTA SI INDEX.HTML
window.addEventListener('load', function() {
  setTimeout(setupMobileMenu, 100);
});