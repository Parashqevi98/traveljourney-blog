// Pret që DOM të ngarkohet plotësisht para se të vendosë event listeners
document.addEventListener('DOMContentLoaded', async function() {
  console.log('DOM content loaded');
  
  // Inicializon faqen
  setupMobileMenu();
  await updateNavbar(); // Përdor async/await për përditësimin e navbar
  loadCategories();
  initializeAnimations();
  
  // Kontrollon nëse duhet të shfaqë mesazhin e mirëseardhjes ose të trajtojë ridrejtimet
  checkLoginSuccess();
  checkRedirection();
  
  // Trajton funksionalitetin tjetër të faqes
  setupSignUpCta();
  initializeCounters();
});

// Ndryshon menunë mobile
function setupMobileMenu() {
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileMenuToggle && navLinks) {
    // Heq event listeners të mëparshëm duke klonuar dhe zëvendësuar
    const newMobileMenuToggle = mobileMenuToggle.cloneNode(true);
    mobileMenuToggle.parentNode.replaceChild(newMobileMenuToggle, mobileMenuToggle);
    
    // Shton event click për të ndryshuar menunë mobile
    newMobileMenuToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      navLinks.classList.toggle('active');
    });
    
    // Mbyll menunë kur klikon jashtë
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && 
          !document.querySelector('.mobile-menu-toggle').contains(e.target) && 
          navLinks.classList.contains('active')) {
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
          e.stopPropagation();
        }
      });
    }
  });
}

// Funksioni për të përditësuar navbar bazuar në statusin e login
async function updateNavbar() {
  const loginLogoutBtn = document.getElementById("loginLogoutBtn");
  const registerItem = document.getElementById("registerItem");
  const profileItem = document.getElementById("profileItem");
  const ctaSignUpBtn = document.getElementById("ctaSignUpBtn");

  if (loginLogoutBtn) {
    const isLoggedIn = localStorage.getItem("accessToken") !== null;

    if (isLoggedIn) {
      // Nëse është i loguar, shfaq "Logout" dhe shton click handler
      loginLogoutBtn.textContent = "Logout";
      loginLogoutBtn.href = "#"; // Largon linkun e vërtetë
      
      // Fsheh butonin e regjistimit kur është i loguar
      if (registerItem) registerItem.style.display = "none";
      
      // Shfaq elementin e profilit kur është i loguar
      if (profileItem) profileItem.style.display = "list-item";

      // Heq click handlers të mëparshëm duke klonuar dhe zëvendësuar
      const newBtn = loginLogoutBtn.cloneNode(true);
      loginLogoutBtn.parentNode.replaceChild(newBtn, loginLogoutBtn);

      // Shton event listener për logout
      document.getElementById("loginLogoutBtn").addEventListener("click", (e) => {
        e.preventDefault();
        // Pastron storage-in
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userProfile");
        // Shfaq mesazhin e suksesshëm
        showNotification("You have been logged out successfully.", "success");
        // Ridrejton në faqen kryesore pas një kohe të shkurtër
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);
      });
      
      // Përpiqet të marrë dhe shfaqë të dhënat e profilit të përdoruesit
      if (profileItem) {
        try {
          const userProfile = await fetchUserProfile();
          if (userProfile) {
            const profileLink = profileItem.querySelector('a');
            if (profileLink) {
              // Shfaq emrin dhe mbiemrin nëse janë të disponueshëm
              const fullName = `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim();
              profileLink.innerHTML = `<i class="fas fa-user-circle"></i> ${fullName || userProfile.email || 'My Profile'}`;
            }
          }
        } catch (error) {
          console.error("Gabim në marrjen e profilit të përdoruesit:", error);
        }
      }
      
      // Përditëson butonin CTA nëse është i loguar
      if (ctaSignUpBtn) {
        ctaSignUpBtn.textContent = "Explore Posts";
        ctaSignUpBtn.href = "posts.html";
      }
    } else {
      // Nëse nuk është i loguar, vetëm e vendos si Login pa asnjë event handler
      loginLogoutBtn.textContent = "Login";
      loginLogoutBtn.href = "login.html";
      
      // Shfaq butonin e regjistimit kur nuk është i loguar
      if (registerItem) registerItem.style.display = "list-item";
      
      // Fsheh butonin e profilit kur nuk është i loguar
      if (profileItem) profileItem.style.display = "none";

      // Heq click handlers
      const newBtn = loginLogoutBtn.cloneNode(true);
      loginLogoutBtn.parentNode.replaceChild(newBtn, loginLogoutBtn);
      
      // Mbajt butonin CTA si Sign Up nëse nuk është i loguar
      if (ctaSignUpBtn) {
        ctaSignUpBtn.textContent = "Sign Up Now";
        ctaSignUpBtn.href = "register.html";
      }
    }
  }
}

// Funksioni për të konfiguruar butonin CTA të Sign Up
function setupSignUpCta() {
  const ctaSignUpBtn = document.getElementById("ctaSignUpBtn");
  
  if (ctaSignUpBtn) {
    ctaSignUpBtn.addEventListener("click", (e) => {
      const isLoggedIn = localStorage.getItem("accessToken") !== null;
      
      if (!isLoggedIn && e.target.textContent === "Sign Up Now") {
        // Sjellja e parazgjedhur do të funksionojë (navigo në register.html)
      } else if (isLoggedIn && e.target.textContent === "Explore Posts") {
        e.preventDefault();
        window.location.href = "posts.html";
      }
    });
  }
}

// Funksioni për të inicializuar animacionet e numëruesit
function initializeCounters() {
  const statNumbers = document.querySelectorAll('.stat-number');
  
  const animateCounter = (element, target) => {
    let current = 0;
    const increment = target / 50; // Kontrolli i kohëzgjatjes së animacionit
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        element.textContent = target.toString() + (target >= 1000 ? 'K+' : '+');
        clearInterval(timer);
      } else {
        const displayValue = Math.floor(current);
        element.textContent = displayValue.toString() + (target >= 1000 ? 'K+' : '+');
      }
    }, 20);
  };
  
  const observeCounters = () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const text = element.textContent;
          
          // Nxjerr numrin nga teksti
          let targetValue;
          if (text.includes('50+')) {
            targetValue = 50;
          } else if (text.includes('100K+')) {
            targetValue = 100;
          } else if (text.includes('500+')) {
            targetValue = 500;
          }
          
          if (targetValue) {
            animateCounter(element, targetValue);
            observer.unobserve(element);
          }
        }
      });
    });
    
    statNumbers.forEach(stat => observer.observe(stat));
  };
  
  if (statNumbers.length > 0) {
    observeCounters();
  }
}

// Funksioni për marrjen e të dhënave të përdoruesit të loguar
async function fetchUserProfile() {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) return null;
  
  try {
    const response = await fetch("https://localhost:7059/api/Users/my-profile-with-posts", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token i skaduar ose jo i vlefshëm
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        updateNavbar();
        return null;
      }
      throw new Error("Problem fetching profile");
    }
    
    const userData = await response.json();
    // Ruaj të dhënat e përdoruesit në localStorage për përdorim të shpejtë
    localStorage.setItem("userProfile", JSON.stringify(userData));
    return userData;
  } catch (error) {
    console.error("Gabim në marrjen e profilit:", error);
    return null;
  }
}

// Funksioni për ngarkimin e kategorive në dropdown
function loadCategories() {
  const categoryList = document.getElementById("categoryList");
  if (!categoryList) return;
  
  showLoader("categoryList");
  
  fetch("https://localhost:7059/api/Blog/GetAllCategories")
    .then(res => {
      if (!res.ok) {
        throw new Error("Server problems. Please try again later.");
      }
      return res.json();
    })
    .then(categories => {
      hideLoader("categoryList");
      categoryList.innerHTML = ""; // Pastron kategoritë ekzistuese
      
      if (categories.length === 0) {
        const li = document.createElement("li");
        li.innerHTML = "<span>No categories available</span>";
        categoryList.appendChild(li);
        return;
      }
      
      categories.forEach(cat => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="categories.html?id=${cat.id}&name=${encodeURIComponent(cat.name)}">${cat.name}</a>`;
        categoryList.appendChild(li);
      });
    })
    .catch(err => {
      console.error("Gabim në ngarkimin e kategorive:", err);
      hideLoader("categoryList");
      const list = document.getElementById("categoryList");
      if (list) {
        list.innerHTML = `<li><span>Error loading categories</span></li>`;
      }
    });
}

// Funksioni për të inicializuar animacionet
function initializeAnimations() {
  // Vendos stilet fillestare për animacion
  const elementsToAnimate = document.querySelectorAll('.mission-card, .explore-card, .about-text-card, .about-image-card, .vision-content-card, .vision-image-card, .goal-item');
  
  if (elementsToAnimate.length > 0) {
    elementsToAnimate.forEach((element, index) => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(30px)';
      element.style.transition = `all 0.6s ease-out ${index * 0.1}s`;
    });
    
    // Ekzekuton kontrollin e animacionit në ngarkim dhe scroll
    const animateOnScroll = function() {
      const elements = document.querySelectorAll('.mission-card, .explore-card, .about-text-card, .about-image-card, .vision-content-card, .vision-image-card, .goal-item');
      
      elements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const screenPosition = window.innerHeight / 1.3;
        
        if (elementPosition < screenPosition) {
          element.style.opacity = '1';
          element.style.transform = 'translateY(0)';
        }
      });
    };
    
    window.addEventListener('scroll', animateOnScroll);
    window.addEventListener('load', animateOnScroll);
  }
}

// Shfaq/fsheh indikatorin e ngarkimit
function showLoader(containerId) {
  const container = document.getElementById(containerId) || document.querySelector(`.${containerId}`) || document.querySelector(`.${containerId} .container`);
  if (container) {
    const loader = document.createElement('div');
    loader.className = 'loading';
    loader.id = `${containerId}-loader`;
    container.appendChild(loader);
  }
}

function hideLoader(containerId) {
  const loader = document.getElementById(`${containerId}-loader`);
  if (loader) {
    loader.remove();
  }
}

// Kontrollon nëse duhet të shfaqë mesazhin e mirëseardhjes pas login
function checkLoginSuccess() {
  const justLoggedIn = sessionStorage.getItem('justLoggedIn');
  if (justLoggedIn) {
    sessionStorage.removeItem('justLoggedIn');
    showNotification('Welcome! You have been logged in successfully.', 'success');
  }
}

// Kontrollon nëse ridrejtimi është i nevojshëm pas login
function checkRedirection() {
  const redirectPath = sessionStorage.getItem('redirectAfterLogin');
  if (redirectPath && localStorage.getItem('accessToken')) {
    sessionStorage.removeItem('redirectAfterLogin');
    window.location.href = redirectPath;
  }
}

// Funksioni për të shfaqur njoftimet
function showNotification(message, type = 'info') {
  // Kontrollon nëse kontejneri i njoftimeve ekziston, nëse jo e krijon
  let notificationContainer = document.getElementById('notification-container');
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
    `;
    document.body.appendChild(notificationContainer);
  }
  
  // Krijon elementin e njoftimit
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span>${message}</span>
      <button class="close-btn">&times;</button>
    </div>
  `;
  notification.style.cssText = `
    background-color: ${type === 'success' ? '#dff0d8' : type === 'error' ? '#f2dede' : '#d9edf7'};
    color: ${type === 'success' ? '#3c763d' : type === 'error' ? '#a94442' : '#31708f'};
    padding: 15px;
    margin-bottom: 10px;
    border-radius: 4px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    opacity: 0;
    transform: translateX(50px);
    transition: opacity 0.3s ease, transform 0.3s ease;
  `;
  
  // Shton në kontejner
  notificationContainer.appendChild(notification);
  
  // Animon hyrjen
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 10);
  
  // Shton funksionalitetin e butonit të mbylljes
  const closeBtn = notification.querySelector('.close-btn');
  closeBtn.addEventListener('click', () => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(50px)';
    setTimeout(() => {
      notification.remove();
    }, 300);
  });
  
  // Largon automatikisht pas 5 sekondash
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(50px)';
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 300);
    }
  }, 5000);
}

// Shton Lazy Loading për imazhet
function setupLazyLoading() {
  if ('loading' in HTMLImageElement.prototype) {
    // Shfletuesi mbështet lazy loading nativ
    const images = document.querySelectorAll('img:not([loading])');
    images.forEach(img => {
      img.setAttribute('loading', 'lazy');
    });
  }
}

// Thërret setupMobileMenu përsëri pasi gjithçka është ngarkuar plotësisht
window.addEventListener('load', function() {
  // Pret një moment për të siguruar që gjithçka është renderuar plotësisht
  setTimeout(setupMobileMenu, 100);
  setupLazyLoading();
});