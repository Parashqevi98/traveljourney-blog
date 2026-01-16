document.addEventListener("DOMContentLoaded", async () => {
  // Inicializon faqen
  await updateNavbar(); // Përdor async/await për përditësimin e navbar
  loadPosts();
  handleCreatePostButton();
  loadCategories();
  setupFilters();
  setupLoadMore();
  setupMobileMenu();
  setupLoginDialog();
  
  // Kontrollon nëse duhet të shfaqë mesazhin e mirëseardhjes ose të trajtojë ridrejtimet
  checkLoginSuccess();
  checkRedirection();
});

// Variabla globale
let currentPage = 1;
const postsPerPage = 9;
let allPosts = [];
let filteredPosts = [];
let isLoading = false;

// Ndryshon menunë mobile
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
  
  // Trajton dropdown në pamjen mobile
  const dropdowns = document.querySelectorAll('.dropdown');
  dropdowns.forEach(dropdown => {
    if (window.innerWidth <= 768) {
      const link = dropdown.querySelector('a');
      if (link) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          dropdown.classList.toggle('active');
        });
      }
    }
  });
}

// Funksioni për të ngarkuar postimet
function loadPosts(resetPage = true) {
  if (resetPage) {
    currentPage = 1;
  }
  
  if (isLoading) return;
  isLoading = true;
  
  // Shfaq indikatorin e ngarkimit
  const postsContainer = document.getElementById("postsContainer");
  if (currentPage === 1) {
    postsContainer.innerHTML = `
      <div class="loading-container">
        <div class="loading"></div>
        <p>Loading amazing travel stories...</p>
      </div>
    `;
  }
  
  // Merr parametrat e filtrit
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get('category');
  const searchQuery = document.getElementById('searchInput')?.value || '';
  const sortOption = document.getElementById('sortOptions')?.value || 'newest';
  
  // Përdor endpoint-in e duhur bazuar në filtrin e kategorisë
  let endpoint = "https://localhost:7059/api/Blog/GetAllPostsPublished";
  if (categoryId) {
    endpoint = `https://localhost:7059/api/Blog/GetPostsByCategory/${categoryId}`;
  }
  
  fetch(endpoint)
    .then(res => {
      if (!res.ok) {
        throw new Error(`Failed to load posts: ${res.status}`);
      }
      return res.json();
    })
    .then(posts => {
      console.log("Postimet u morën:", posts);
      
      // Ruaj të gjitha postimet dhe apliko filtrat
      allPosts = posts;
      applyFilters();
      
      isLoading = false;
    })
    .catch(err => {
      console.error("Gabim në ngarkimin e postimeve:", err);
      const container = document.getElementById("postsContainer");
      container.innerHTML = `<p class="error-message">Failed to load posts. ${err.message}</p>`;
      isLoading = false;
    });
}

// Funksioni për të aplikuar filtrat dhe renderuar postimet
function applyFilters() {
  const searchQuery = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const categoryFilter = document.getElementById('categoryFilter')?.value || '';
  const sortOption = document.getElementById('sortOptions')?.value || 'newest';
  
  // Filtron postimet
  filteredPosts = allPosts.filter(post => {
    // Filtri i kërkimit
    const matchesSearch = searchQuery === '' || 
                          post.title.toLowerCase().includes(searchQuery) || 
                          (post.content && post.content.toLowerCase().includes(searchQuery));
    
    // Filtri i kategorisë
    const matchesCategory = categoryFilter === '' || 
                           (post.categories && post.categories.some(cat => cat.id === categoryFilter));
    
    return matchesSearch && matchesCategory;
  });
  
  // Rendit postimet
  filteredPosts.sort((a, b) => {
    if (sortOption === 'newest') {
      return new Date(b.createdAt || b.publishedDate) - new Date(a.createdAt || a.publishedDate);
    } else if (sortOption === 'oldest') {
      return new Date(a.createdAt || a.publishedDate) - new Date(b.createdAt || b.publishedDate);
    } else if (sortOption === 'popular') {
      // Mund të duhet të shtosh një pronësi 'views' ose 'likes' në postimet tuaja për këtë
      return (b.views || 0) - (a.views || 0);
    }
    return 0;
  });
  
  // Renderon faqen e parë
  renderPosts(true);
  
  // Përditëson dukshmërinë e butonit "ngarko më shumë"
  updateLoadMoreButton();
}

// Funksioni për të renderuar postimet
function renderPosts(resetContainer = false) {
  const container = document.getElementById("postsContainer");
  
  // Pastron kontejnerin nëse po rivendos
  if (resetContainer) {
    container.innerHTML = '';
  }
  
  // Llogarit cilat postime të shfaqë bazuar në faqosjen
  const startIndex = resetContainer ? 0 : (currentPage - 1) * postsPerPage;
  const endIndex = currentPage * postsPerPage;
  const postsToShow = filteredPosts.slice(startIndex, endIndex);
  
  if (postsToShow.length === 0 && resetContainer) {
    container.innerHTML = "<p class='no-posts'>No posts match your search criteria. Try adjusting your filters.</p>";
    return;
  }
  
  // Krijon dhe shton kartat e postimeve
  postsToShow.forEach(post => {
    const postDiv = document.createElement("div");
    postDiv.className = "post-card";
    
    // Sigurohet që po përdorim pronësinë e duhur për ID e postimit
    const postId = post.guid || post.id || '';
    
    // Merr emrat e kategorive
    let categoryName = 'Uncategorized';
    let categoryHTML = `<span class="post-category">Uncategorized</span>`;
    
    if (post.categories && post.categories.length > 0) {
      categoryName = post.categories[0].categoryName || post.categories[0].name;
      categoryHTML = `<span class="post-category">${categoryName}</span>`;
    }
    
    // Formaton datën
    const postDate = post.publishedDate || post.createdAt || new Date().toISOString();
    const formattedDate = new Date(postDate).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
    
    // Merr informacionin e autorit
    const authorName = getAuthorName(post);
    const authorId = getAuthorId(post);
    const authorLink = authorId ? 
      `<a href="author.html?id=${authorId}" class="author-link">${authorName}</a>` : 
      authorName;
    
    postDiv.innerHTML = `
      <div class="post-image">
        ${post.imageUrl ? `<img src="${post.imageUrl}" alt="${post.title}" />` : 
          `<img src="../image/placeholder.jpg" alt="Placeholder image" />`}
      </div>
      <div class="post-content">
        ${categoryHTML}
        <h3>${post.title}</h3>
        <p>${post.content ? post.content.substring(0, 120) + '...' : 'No content available'}</p>
        <div class="post-meta">
          <div class="post-author">By ${authorLink} • ${formattedDate}</div>
        </div>
        <a href="singlepost.html?id=${encodeURIComponent(postId)}" class="read-more-btn">Read More</a>
      </div>
    `;

    // E bën të gjithë kartën të klikueshme, por përjashton linkun e autorit dhe butonin "lexo më shumë"
    postDiv.addEventListener('click', (e) => {
      const isAuthorLink = e.target.classList.contains('author-link') || 
                          e.target.closest('.author-link');
      const isReadMoreBtn = e.target.classList.contains('read-more-btn');
      
      if (!isAuthorLink && !isReadMoreBtn) {
        window.location.href = `singlepost.html?id=${encodeURIComponent(postId)}`;
      }
    });
    
    postDiv.style.cursor = 'pointer';
    container.appendChild(postDiv);
  });
  
  // Përditëson dukshmërinë e butonit "ngarko më shumë"
  updateLoadMoreButton();
}

// Funksioni për të konfiguruar filtrat
function setupFilters() {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const categoryFilter = document.getElementById('categoryFilter');
  const sortOptions = document.getElementById('sortOptions');
  
  // Ngjarje për input-in e kërkimit
  if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        applyFilters();
      }
    });
  }
  
  // Klikimi i butonit të kërkimit
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      applyFilters();
    });
  }
  
  // Ndryshimi i filtrit të kategorisë
  if (categoryFilter) {
    categoryFilter.addEventListener('change', () => {
      applyFilters();
    });
    
    // Mbush opsionet e kategorive
    fetch('https://localhost:7059/api/Blog/GetAllCategories')
      .then(response => response.json())
      .then(categories => {
        categories.forEach(category => {
          const option = document.createElement('option');
          option.value = category.id;
          option.textContent = category.name;
          categoryFilter.appendChild(option);
        });
      })
      .catch(error => console.error('Gabim në ngarkimin e opsioneve të kategorive:', error));
  }
  
  // Ndryshimi i opsioneve të renditjes
  if (sortOptions) {
    sortOptions.addEventListener('change', () => {
      applyFilters();
    });
  }
}

// Funksioni për të konfiguruar butonin "ngarko më shumë"
function setupLoadMore() {
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      currentPage++;
      renderPosts(false);
    });
  }
}

// Funksioni për të përditësuar dukshmërinë e butonit "ngarko më shumë"
function updateLoadMoreButton() {
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  
  if (loadMoreBtn) {
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    if (currentPage >= totalPages) {
      loadMoreBtn.style.display = 'none';
    } else {
      loadMoreBtn.style.display = 'inline-block';
    }
  }
}

// Funksioni për të trajtuar klikimin e butonit "Krijo Postim"
function handleCreatePostButton() {
  const createPostBtn = document.getElementById("createPostBtn");
  
  if (createPostBtn) {
    // Kontrollon nëse përdoruesi është i loguar së pari dhe çaktivizon/aktivizon butonin në përputhje
    const isLoggedIn = localStorage.getItem("accessToken") !== null;
    
    if (!isLoggedIn) {
      // Çaktivizon butonin vizualisht por e mban të klikueshëm
      createPostBtn.classList.add("disabled-button");
      createPostBtn.title = "Please log in to create a post";
      
      // Shton ngjarjen click për të shfaqur dialogun e login-it
      createPostBtn.addEventListener("click", showLoginDialog);
    } else {
      createPostBtn.classList.remove("disabled-button");
      createPostBtn.title = "Create a new post";
      
      // Shton navigim të drejtpërdrejtë në faqen e krijimit
      createPostBtn.addEventListener("click", () => {
        window.location.href = "create.html";
      });
    }
  }
}

// Konfiguron dialogun modal të login-it
function setupLoginDialog() {
  const modal = document.getElementById("loginDialogModal");
  const closeModal = document.querySelector(".close-modal");
  const cancelBtn = document.getElementById("cancelLoginBtn");
  const proceedBtn = document.getElementById("proceedLoginBtn");
  
  if (!modal) return;
  
  // Ngjarjet për mbylljen e modal-it
  if (closeModal) {
    closeModal.onclick = () => {
      modal.style.display = "none";
    };
  }
  
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      modal.style.display = "none";
    };
  }
  
  if (proceedBtn) {
    proceedBtn.onclick = () => {
      modal.style.display = "none";
      sessionStorage.setItem("redirectAfterLogin", "create.html");
      window.location.href = "login.html";
    };
  }
  
  // Mbyll nëse klikohet jashtë modal-it
  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };
}

// Funksioni për të shfaqur dialogun e login-it
function showLoginDialog(e) {
  e.preventDefault();
  
  const modal = document.getElementById("loginDialogModal");
  if (modal) {
    modal.style.display = "block";
  } else {
    // Fallback nëse modal nuk ekziston
    showNotification("Please log in to create a post", "info");
    setTimeout(() => {
      sessionStorage.setItem("redirectAfterLogin", "create.html");
      window.location.href = "login.html";
    }, 1500);
  }
}

// Funksion ndihmues për të marrë emrin e autorit nga postimi
function getAuthorName(post) {
  // Kontrollon të gjitha fushat e mundshme të emrit të autorit
  if (post.authorName) {
    return post.authorName;
  }
  
  // Përpiqet të konstruojë nga emri dhe mbiemri
  const firstName = post.authorFirstName || post.author?.firstName || '';
  const lastName = post.authorLastName || post.author?.lastName || '';
  
  if (firstName || lastName) {
    return `${firstName} ${lastName}`.trim();
  }
  
  // Kontrollon nëse ka një objekt autor me pronësinë name
  if (post.author) {
    if (post.author.firstName && post.author.lastName) {
      return `${post.author.firstName} ${post.author.lastName}`;
    }
    if (post.author.name) {
      return post.author.name;
    }
    if (post.author.email) {
      return post.author.email;
    }
  }
  
  if (post.userName) {
    return post.userName;
  }
  
  if (post.userId) {
    // Nëse kemi një userId por jo emër, do të përdorim një vendmbajtës
    return 'Author';
  }
  
  return 'Anonymous';
}

// Funksion ndihmues për të marrë ID e autorit
function getAuthorId(post) {
  if (post.authorId) {
    return post.authorId;
  }
  
  if (post.userId) {
    return post.userId;
  }
  
  if (post.author && post.author.id) {
    return post.author.id;
  }
  
  return null;
}

// Kontrollon nëse duhet të shfaqë mesazhin e mirëseardhjes pas login
function checkLoginSuccess() {
  const justLoggedIn = sessionStorage.getItem('justLoggedIn');
  if (justLoggedIn) {
    sessionStorage.removeItem('justLoggedIn');
    showNotification('Welcome! You have logged in successfully.', 'success');
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

// Thërret setupMobileMenu përsëri pasi gjithçka është ngarkuar plotësisht
window.addEventListener('load', function() {
  // Pret një moment për të siguruar që gjithçka është renderuar plotësisht
  setTimeout(setupMobileMenu, 100);
});