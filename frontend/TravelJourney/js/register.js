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
  
  // Konfiguron menunë mobile
  setupMobileMenu();
  
  const registerForm = document.getElementById("registerForm");
  
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const fullName = document.getElementById("fullName").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
      const errorElement = document.getElementById("error");
      
      // Pastron mesazhet e mëparshme të gabimit
      if (errorElement) {
        errorElement.textContent = "";
        errorElement.classList.remove("show");
        errorElement.classList.remove("success-message");
      }
      
      // Validimet bazike të formës
      if (!fullName || !email || !password || !confirmPassword) {
        if (errorElement) {
          errorElement.textContent = "Ju lutemi plotësoni të gjitha fushat";
          errorElement.classList.add("show");
        }
        return;
      }
      
      // Kontrollon nëse fjalëkalimet përputhen
      if (password !== confirmPassword) {
        if (errorElement) {
          errorElement.textContent = "Fjalëkalimet nuk përputhen";
          errorElement.classList.add("show");
        }
        return;
      }
      
      // Ndan emrin e plotë në emër dhe mbiemër
      const nameParts = fullName.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      
      try {
        // Dërgon kërkesën për regjistrimin
        const response = await fetch("https://localhost:7059/api/Users/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: email,
            password: password,
            firstName: firstName,
            lastName: lastName
          })
        });
        
        if (response.ok) {
          // Regjistrim i suksesshëm
          if (errorElement) {
            errorElement.textContent = "Regjistrimi u krye me sukses! Duke ridrejtuar në login...";
            errorElement.classList.add("success-message");
            errorElement.classList.add("show");
          }
          
          // Ridrejton në faqen e login-it pas 1.5 sekondash
          setTimeout(() => {
            window.location.href = "login.html";
          }, 1500);
        } else {
          // Trajton gabimet e regjistrimit
          const errorData = await response.json().catch(() => ({}));
          console.error("Përgjigja e gabimit:", errorData);
          
          if (errorElement) {
            errorElement.textContent = errorData.description || 
                                      errorData.message || 
                                      "Regjistrimi dështoi. Ju lutemi provoni përsëri.";
            errorElement.classList.add("show");
          }
        }
      } catch (err) {
        // Trajton gabimet e rrjetit
        console.error("Gabim gjatë regjistrimit:", err);
        
        if (errorElement) {
          errorElement.textContent = "Gabim në rrjet. Ju lutemi provoni përsëri më vonë.";
          errorElement.classList.add("show");
        }
      }
    });
  }
});

// Funksioni për të ngarkuar kategoritë
function loadCategories() {
  // Kontrollon nëse jemi në modalitetin e zhvillimit ose nëse API është e disponueshme
  if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
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
            a.href = 'posts.html?category=' + category.id;
            a.textContent = category.name;
            li.appendChild(a);
            categoryList.appendChild(li);
          });
        }
      })
      .catch(error => {
        // Dështon në heshtje - shton disa kategori të parazgjedhura për demo
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
            a.href = 'posts.html?category=' + category.id;
            a.textContent = category.name;
            li.appendChild(a);
            categoryList.appendChild(li);
          });
        }
      });
  } else {
    // Në prodhim, kategoritë do të ngarkohen nga serveri
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
      // Nëse është i loguar, shfaq "Logout"
      loginLogoutBtn.textContent = "Logout";
      loginLogoutBtn.href = "#";
      
      // Fsheh butonin e regjistrimit kur është i loguar
      if (registerItem) {
        registerItem.style.display = "none";
      }
      
      // Heq event listeners të mëparshëm duke klonuar dhe zëvendësuar
      const newBtn = loginLogoutBtn.cloneNode(true);
      loginLogoutBtn.parentNode.replaceChild(newBtn, loginLogoutBtn);
      
      // Shton event listener për logout
      document.getElementById("loginLogoutBtn").addEventListener("click", (e) => {
        e.preventDefault();
        // Pastron storage-in
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userProfile");
        // Ridrejton në faqen kryesore
        window.location.href = "index.html";
      });
    } else {
      // Nëse nuk është i loguar, shfaq "Login"
      loginLogoutBtn.textContent = "Login";
      loginLogoutBtn.href = "login.html";
      
      // Shfaq butonin e regjistrimit kur nuk është i loguar
      if (registerItem) {
        registerItem.style.display = "list-item";
      }
      
      // Heq event listeners
      const newBtn = loginLogoutBtn.cloneNode(true);
      loginLogoutBtn.parentNode.replaceChild(newBtn, loginLogoutBtn);
    }
  }
}

// Funksioni për të konfiguruar menunë mobile
function setupMobileMenu() {
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileMenuToggle && navLinks) {
    // Shton event listener për të ndryshuar menunë mobile
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
  
  // Trajton dropdown në pamjen mobile
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

// Thërret setupMobileMenu përsëri pasi gjithçka është ngarkuar plotësisht
window.addEventListener('load', function() {
  setTimeout(setupMobileMenu, 100);
});