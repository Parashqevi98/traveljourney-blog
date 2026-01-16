document.addEventListener('DOMContentLoaded', async function() {
  console.log("Dokumenti u ngarkua, duke kontrolluar parametrat e URL...");
  
  // Debug URL për zgjidhjen e problemeve
  console.log("URL e plotë:", window.location.href);
  console.log("Parametrat e kërkimit:", window.location.search);
  
  // Inicializon faqen
  setupMobileMenu();
  await updateNavbar(); // Përdor async/await për përditësimin e navbar
  loadCategories();
  setupLoginDialog();
  
  // Nxjerr ID e postimit nga parametrat e URL
  const urlParams = new URLSearchParams(window.location.search);
  console.log("Të gjithë parametrat e URL:", Array.from(urlParams.entries()));
  let postId = urlParams.get('id');
  console.log("ID e postimit u nxor:", postId);
  
  if (postId) {
    console.log("ID e postimit për përdorim:", postId);
    loadPostDetails(postId);
  } else {
    // Nëse nuk gjendet ID e postimit, shfaq mesazhin e gabimit
    console.error("Nuk u gjet ID e postimit në URL!");
    const postContainer = document.getElementById('postDetailContainer');
    if (postContainer) {
      postContainer.innerHTML = `
        <div class="error-message">
          <h2>Post ID not found in URL!</h2>
          <p>Please check the link you used to access this page.</p>
          <p>URL parameters: ${window.location.search}</p>
          <a href="posts.html" class="back-button">Back to Posts</a>
        </div>
      `;
    }
    
    // Fsheh seksionet e autorit nëse nuk ka ID postimi
    hideAuthorSections();
  }
  
  // Kontrollon nëse duhet të shfaqë mesazhin e mirëseardhjes ose të trajtojë ridrejtimet
  checkLoginSuccess();
  checkRedirection();
});

// Funksionaliteti i përmirësuar i ndryshuesit të menusë mobile
function setupMobileMenu() {
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  const navbar = document.querySelector('.navbar');
  
  if (mobileMenuToggle && navLinks) {
    // Heq event listeners të mëparshëm duke klonuar dhe zëvendësuar
    const newMobileMenuToggle = mobileMenuToggle.cloneNode(true);
    mobileMenuToggle.parentNode.replaceChild(newMobileMenuToggle, mobileMenuToggle);
    
    // Shton event click për të ndryshuar menunë mobile
    newMobileMenuToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      navLinks.classList.toggle('active');
      
      // Ndryshon klasën menu-open në navbar për animacion (opsionale)
      if (navbar) {
        navbar.classList.toggle('menu-open');
      }
    });
    
    // Mbyll menunë kur klikohet jashtë
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && 
          !document.querySelector('.mobile-menu-toggle').contains(e.target) && 
          navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        if (navbar) {
          navbar.classList.remove('menu-open');
        }
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
  const userNameDisplay = document.getElementById("userNameDisplay");

  if (loginLogoutBtn) {
    const isLoggedIn = localStorage.getItem("accessToken") !== null;

    if (isLoggedIn) {
      // Nëse është i loguar, shfaq "Logout" dhe shton click handler
      loginLogoutBtn.textContent = "Logout";
      loginLogoutBtn.href = "#"; // Heq lidhjen e vërtetë
      
      // Fsheh butonin e regjistrimit kur është i loguar
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
        // Shfaq mesazhin e suksesit
        showNotification("You have been logged out successfully.", "success");
        // Ridrejton në faqen kryesore pas një kohe të shkurtër
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);
      });
      
      // Përpiqet të marrë dhe shfaqë të dhënat e profilit të përdoruesit
      if (profileItem && userNameDisplay) {
        try {
          const userProfile = await fetchUserProfile();
          if (userProfile) {
            // Shfaq emrin dhe mbiemrin nëse janë të disponueshëm
            const fullName = `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim();
            userNameDisplay.textContent = fullName || userProfile.email || 'My Profile';
          }
        } catch (error) {
          console.error("Gabim në marrjen e profilit të përdoruesit:", error);
        }
      }
    } else {
      // Nëse nuk është i loguar, vetëm e vendos si Login pa asnjë event handler
      loginLogoutBtn.textContent = "Login";
      loginLogoutBtn.href = "login.html";
      
      // Shfaq butonin e regjistrimit kur nuk është i loguar
      if (registerItem) registerItem.style.display = "list-item";
      
      // Fsheh butonin e profilit kur nuk është i loguar
      if (profileItem) profileItem.style.display = "none";

      // Heq click handlers
      const newBtn = loginLogoutBtn.cloneNode(true);
      loginLogoutBtn.parentNode.replaceChild(newBtn, loginLogoutBtn);
    }
  }
  
  // Ngarkon dhe mbush kategoritë në dropdown
  loadCategories();
}

// Funksioni për marrjen e të dhënave të përdoruesit të loguar
async function fetchUserProfile() {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) return null;
  
  try {
    // Kontrollon nëse kemi tashmë të dhëna profili në localStorage
    const cachedProfile = localStorage.getItem("userProfile");
    if (cachedProfile) {
      try {
        return JSON.parse(cachedProfile);
      } catch (e) {
        // Nëse parsing-u dështon, vazhdon të marrë nga serveri
        console.error("Gabim në analizimin e profilit të ruajtur:", e);
      }
    }
    
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
        localStorage.removeItem("userProfile");
        updateNavbar();
        return null;
      }
      throw new Error("Failed to fetch profile");
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
  
  // Kontrollon nëse kemi ngarkuar kategoritë së fundmi (cache për 5 minuta)
  const cachedCategories = localStorage.getItem('cachedCategories');
  const cacheTime = localStorage.getItem('categoriesCacheTime');
  const currentTime = new Date().getTime();
  
  // Përdor kategoritë e ruajtura nëse ekzistojnë dhe janë më pak se 5 minuta të vjetra
  if (cachedCategories && cacheTime && (currentTime - cacheTime < 5 * 60 * 1000)) {
    try {
      const categories = JSON.parse(cachedCategories);
      populateCategoryDropdown(categories);
      return;
    } catch (error) {
      console.error("Gabim në analizimin e kategorive të ruajtura:", error);
      // Vazhdon për të marrë kategori të reja
    }
  }
  
  fetch("https://localhost:7059/api/Blog/GetAllCategories")
    .then(res => {
      if (!res.ok) {
        throw new Error("Server issues. Please try again later.");
      }
      return res.json();
    })
    .then(categories => {
      // Ruaj kategoritë në cache
      localStorage.setItem('cachedCategories', JSON.stringify(categories));
      localStorage.setItem('categoriesCacheTime', currentTime.toString());
      
      populateCategoryDropdown(categories);
    })
    .catch(err => {
      console.error("Gabim në ngarkimin e kategorive:", err);
      categoryList.innerHTML = `<li><span>Error loading categories</span></li>`;
    });
}

// Funksioni për të mbushur dropdown-in e kategorisë
function populateCategoryDropdown(categories) {
  const categoryList = document.getElementById('categoryList');
  
  if (!categoryList) return;
  
  categoryList.innerHTML = '';
  categories.forEach(cat => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="categories.html?id=${cat.id}&name=${encodeURIComponent(cat.name)}">${cat.name}</a>`;
    categoryList.appendChild(li);
  });
}

// Funksioni për të fshehur seksionet e relacionuara me autorin kur nuk gjendet postim
function hideAuthorSections() {
  const authorWidget = document.getElementById('authorProfileWidget');
  if (authorWidget) {
    authorWidget.style.display = 'none';
  }
  
  const authorPostsSection = document.getElementById('authorPostsSection');
  if (authorPostsSection) {
    authorPostsSection.style.display = 'none';
  }
}

// Funksioni për të ngarkuar detajet e postimit
function loadPostDetails(postId) {
  const postContainer = document.getElementById('postDetailContainer');
  
  if (!postContainer) {
    console.error('Elementi i kontejnerit të postimit nuk u gjet!');
    return;
  }
  
  // Shfaq mesazhin e ngarkimit
  postContainer.innerHTML = `
    <div class="loading-container">
      <div class="loading"></div>
      <p>Loading post details...</p>
    </div>
  `;
  
  // Merr token për autorizim
  const token = localStorage.getItem('accessToken');
  
  // Log informacione për thirrjen e fetch
  console.log("Duke marrë postimin me ID:", postId);
  console.log("URL e API:", `https://localhost:7059/api/Blog/GetPosts/${postId}`);

  // Merr detajet e postimit nga API
  fetch(`https://localhost:7059/api/Blog/GetPosts/${encodeURIComponent(postId)}`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      console.log("Statusi i përgjigjes së API:", response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch post details (Status: ${response.status})`);
      }
      return response.json();
    })
    .then(post => {
      // Log të dhënat e postimit për debug
      console.log("Të dhënat e postimit u morën:", post);
      
      // Kontrollon nëse kemi marrë të dhëna të vlefshme
      if (!post) {
        throw new Error("No post data received from API");
      }
      
      // Përditëson titullin e faqes
      document.title = `${post.title || 'Post Details'} - TravelJourney`;
      
      // Përditëson titullin e postimit aktual në breadcrumb
      const currentPostTitle = document.getElementById('currentPostTitle');
      if (currentPostTitle) {
        currentPostTitle.textContent = post.title || 'Current Post';
      }
      
      // Formaton datën për shfaqje më të mirë
      const publishDate = post.publishAt ? new Date(post.publishAt).toLocaleDateString('en-US') : 'Unknown date';
      
      // Merr emrat e kategorive nëse janë të disponueshme
      let categoryDisplay = 'Uncategorized';
      if (post.categories && post.categories.length > 0) {
        categoryDisplay = post.categories.map(cat => cat.categoryName).join(', ');
      }
      
      // Ruaj informacionin e autorit për përdorim të mëvonshëm
      const authorId = post.userId || post.authorId; // Përdor pronësinë e duhur bazuar në përgjigjen e API
      const authorName = post.userName || 'Unknown Author';
      
      // Ndërton strukturën HTML për detajet e postimit - me përmbajtjen e parë, pastaj imazhin
      postContainer.innerHTML = `
        <div class="post-detail">
          <div class="post-detail-header">
            <h1 class="post-title">${post.title || 'Untitled Post'}</h1>
            <div class="post-meta">
              <span class="post-author">
                <i class="fas fa-user"></i> 
                <a href="author.html?id=${authorId}" class="author-link">${authorName}</a>
              </span>
              <span class="post-date"><i class="fas fa-calendar-alt"></i> ${publishDate}</span>
              <span class="post-category"><i class="fas fa-tag"></i> ${categoryDisplay}</span>
            </div>
          </div>
          
          <div class="post-content">
            ${post.content || 'No content available'}
            
            ${post.imageUrl ? `
              <div class="post-image-container">
                <img src="${post.imageUrl}" alt="${post.title || 'Post image'}" loading="lazy" />
              </div>
            ` : ''}
          </div>
          
          <div class="post-actions">
            <a href="#" class="action-button" title="Print"><i class="fas fa-print"></i></a>
            <a href="#" class="action-button" title="Save to favorites"><i class="fas fa-bookmark"></i></a>
          </div>
        </div>
      `;
      
      // Ngarkon detajet e autorit
      if (authorId) {
        loadAuthorProfile(authorId);
        loadAuthorPosts(authorId, postId);
        
        // Përditëson lidhjen "Shiko të Gjitha" me ID e autorit të duhur
        const viewAllLink = document.getElementById('viewAllAuthorPosts');
        if (viewAllLink) {
          viewAllLink.href = `posts.html?author=${authorId}`;
        }
      } else {
        hideAuthorSections();
      }
      
      // Shton event listeners për butonat e veprimit
      const printButton = postContainer.querySelector('.action-button[title="Print"]');
      if (printButton) {
        printButton.addEventListener('click', (e) => {
          e.preventDefault();
          window.print();
        });
      }
      
      const bookmarkButton = postContainer.querySelector('.action-button[title="Save to favorites"]');
      if (bookmarkButton) {
        bookmarkButton.addEventListener('click', (e) => {
          e.preventDefault();
          
          // Kontrollon nëse përdoruesi është i loguar së pari
          if (!localStorage.getItem('accessToken')) {
            showLoginDialog();
            return;
          }
          
          // Merr të preferuarat ekzistuese ose inicializon array bosh
          let bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
          
          // Kontrollon nëse ky postim është tashmë në të preferuara
          const isBookmarked = bookmarks.some(bookmark => bookmark.id === postId);
          
          if (isBookmarked) {
            // Heq nga të preferuarat
            bookmarks = bookmarks.filter(bookmark => bookmark.id !== postId);
            bookmarkButton.innerHTML = '<i class="fas fa-bookmark"></i>';
            bookmarkButton.style.color = '#1a3a5f';
            showNotification('Removed from favorites', 'info');
          } else {
            // Shton në të preferuara
            bookmarks.push({
              id: postId,
              title: post.title || 'Untitled Post',
              date: new Date().toISOString()
            });
            bookmarkButton.innerHTML = '<i class="fas fa-bookmark"></i>';
            bookmarkButton.style.color = '#4ecdc4';
            showNotification('Added to favorites', 'success');
          }
          
          // Ruaj të preferuarat e përditësuara
          localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
        });
      }
      
      // Konfiguron butonat e ndarjes në sidebar
      const shareButtons = document.querySelectorAll('.share-buttons .share-button');
      if (shareButtons.length > 0) {
        const shareUrl = encodeURIComponent(window.location.href);
        const shareTitle = encodeURIComponent(post.title || 'TravelJourney Post');
        
        // Ndarje në Facebook
        const facebookButton = document.querySelector('.share-button.facebook');
        if (facebookButton) {
          facebookButton.href = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
          facebookButton.target = '_blank';
        }
        
        // Ndarje në Twitter
        const twitterButton = document.querySelector('.share-button.twitter');
        if (twitterButton) {
          twitterButton.href = `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`;
          twitterButton.target = '_blank';
        }
        
        // Ndarje në Pinterest
        const pinterestButton = document.querySelector('.share-button.pinterest');
        if (pinterestButton) {
          let imageUrl = '';
          if (post.imageUrl) {
            imageUrl = `&media=${encodeURIComponent(post.imageUrl)}`;
          }
          pinterestButton.href = `https://pinterest.com/pin/create/button/?url=${shareUrl}&description=${shareTitle}${imageUrl}`;
          pinterestButton.target = '_blank';
        }
        
        // Ndarje në LinkedIn
        const linkedinButton = document.querySelector('.share-button.linkedin');
        if (linkedinButton) {
          linkedinButton.href = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
          linkedinButton.target = '_blank';
        }
      }
    })
    .catch(error => {
      console.error('Gabim në marrjen e detajeve të postimit:', error);
      postContainer.innerHTML = `
        <div class="error-message">
          <h2>Failed to Load Post</h2>
          <p>We couldn't retrieve the post details at this time.</p>
          <p>Error: ${error.message}</p>
          <a href="posts.html" class="back-button"><i class="fas fa-arrow-left"></i> Back to Posts</a>
        </div>
      `;
      hideAuthorSections();
    });
}

// Funksioni për të ngarkuar profilin e autorit
function loadAuthorProfile(authorId) {
  const authorWidget = document.getElementById('authorProfileWidget');
  
  if (!authorWidget) {
    console.error('Elementi i widget-it të autorit nuk u gjet!');
    return;
  }
  
  // Shfaq mesazhin e ngarkimit në widget-in e autorit
  authorWidget.innerHTML = `
    <h3>About the Author</h3>
    <div class="loading-container">
      <div class="loading"></div>
      <p>Loading author profile...</p>
    </div>
  `;
  
  // Merr token për autorizim
  const token = localStorage.getItem('accessToken');
  
  // Log informacione për thirrjen e fetch
  console.log("Duke marrë profilin e autorit me ID:", authorId);
  console.log("URL e API:", `https://localhost:7059/api/Users/author-profile/${authorId}`);

  // Merr detajet e autorit nga API
  fetch(`https://localhost:7059/api/Users/author-profile/${encodeURIComponent(authorId)}`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      console.log("Statusi i përgjigjes së API:", response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch author profile (Status: ${response.status})`);
      }
      return response.json();
    })
    .then(author => {
      // Log të dhënat e autorit për debug
      console.log("Të dhënat e autorit u morën:", author);
      
      // Formaton datën e anëtarësimit
      const joinedDate = author.joinedDate 
        ? new Date(author.joinedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'Unknown';
      
      // Ndërton strukturën HTML për profilin e autorit
      authorWidget.innerHTML = `
        <h3>About the Author</h3>
        <div class="author-profile">
          <div class="author-image">
            <img src="${author.profileImageUrl || '../images/default-avatar.png'}" alt="${author.firstName} ${author.lastName}" loading="lazy" />
          </div>
          <div class="author-info">
            <h4 class="author-name">
              <a href="author.html?id=${author.id}">${author.firstName} ${author.lastName}</a>
            </h4>
            <p class="author-location">${author.location || 'Location not specified'}</p>
            <p class="author-joined">Member since ${joinedDate}</p>
          </div>
        </div>
        ${author.description ? `<p class="author-bio">${author.description}</p>` : ''}
        <a href="author.html?id=${author.id}" class="author-profile-link">View Full Profile</a>
      `;
    })
    .catch(error => {
      console.error('Gabim në marrjen e profilit të autorit:', error);
      authorWidget.innerHTML = `
        <h3>About the Author</h3>
        <div class="error-message">
          <p>Unable to load author information</p>
        </div>
      `;
    });
}

// Funksioni për të ngarkuar më shumë postime nga i njëjti autor
function loadAuthorPosts(authorId, currentPostId) {
  const authorPostsGrid = document.getElementById('authorPostsGrid');
  
  if (!authorPostsGrid) {
    console.error('Elementi i grid-it të postimeve të autorit nuk u gjet!');
    return;
  }
  
  // Shfaq mesazhin e ngarkimit
  authorPostsGrid.innerHTML = `
    <div class="loading-container">
      <div class="loading"></div>
      <p>Loading more posts from this author...</p>
    </div>
  `;
  
  // Merr token për autorizim
  const token = localStorage.getItem('accessToken');
  
  // Log informacione për thirrjen e fetch
  console.log("Duke marrë postimet nga autori me ID:", authorId);
  console.log("URL e API:", `https://localhost:7059/api/Blog/GetPostsByAuthor/${authorId}`);

  // Merr postimet nga autori nga API
  fetch(`https://localhost:7059/api/Blog/GetPostsByAuthor/${encodeURIComponent(authorId)}`, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      console.log("Statusi i përgjigjes së API:", response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch author posts (Status: ${response.status})`);
      }
      return response.json();
    })
    .then(posts => {
      // Log të dhënat e postimeve për debug
      console.log("Postimet e autorit u morën:", posts);
      
      // Filtron postimin aktual dhe kufizon në 3 postime
      const otherPosts = posts
        .filter(post => post.id !== currentPostId)
        .slice(0, 3);
      
      if (otherPosts.length === 0) {
        // Fsheh seksionin nëse nuk ka postime të tjera
        const authorPostsSection = document.getElementById('authorPostsSection');
        if (authorPostsSection) {
          authorPostsSection.style.display = 'none';
        }
        return;
      }
      
      // Pastron indikatorin e ngarkimit
      authorPostsGrid.innerHTML = '';
      
      // Shton çdo postim në grid
      otherPosts.forEach(post => {
        // Formaton datën
        const publishDate = post.publishAt 
          ? new Date(post.publishAt).toLocaleDateString('en-US') 
          : 'Unknown date';
        
        // Krijon kartën e postimit
        const postCard = document.createElement('div');
        postCard.className = 'author-post-card';
        postCard.innerHTML = `
          <a href="singlepost.html?id=${post.id}" class="author-post-link">
            ${post.imageUrl ? `
              <div class="author-post-image">
                <img src="${post.imageUrl}" alt="${post.title || 'Post image'}" loading="lazy" />
              </div>
            ` : ''}
            <div class="author-post-info">
              <h3 class="author-post-title">${post.title || 'Untitled Post'}</h3>
              <p class="author-post-date"><i class="fas fa-calendar-alt"></i> ${publishDate}</p>
            </div>
          </a>
        `;
        
        authorPostsGrid.appendChild(postCard);
      });
    })
    .catch(error => {
      console.error('Gabim në marrjen e postimeve të autorit:', error);
      
      // Fsheh seksionin për gabim
      const authorPostsSection = document.getElementById('authorPostsSection');
      if (authorPostsSection) {
        authorPostsSection.style.display = 'none';
      }
    });
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
      sessionStorage.setItem("redirectAfterLogin", window.location.href);
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
  if (e) e.preventDefault();
  
  const modal = document.getElementById("loginDialogModal");
  if (modal) {
    modal.style.display = "block";
  } else {
    // Fallback nëse modal nuk ekziston
    showNotification("Please log in to perform this action", "info");
    setTimeout(() => {
      sessionStorage.setItem("redirectAfterLogin", window.location.href);
      window.location.href = "login.html";
    }, 1500);
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