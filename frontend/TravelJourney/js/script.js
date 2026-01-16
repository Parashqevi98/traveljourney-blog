// TravelJourney script.js - Versioni i rregulluar me lidhje të duhur backend
// Variablat globale
const API_BASE_URL = 'https://localhost:7059/api';
const DEFAULT_AVATAR = '../images/default-avatar.jpg';
const DEFAULT_POST_IMAGE = '../images/placeholder.jpg';

// Cache për të dhënat e autorit për të shmangur thirrjet e përsëritura API
const authorCache = new Map();

// Inicializo faqen kur DOM ngarkohet
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Po inicializon faqen kryesore të TravelJourney...");
  
  // Konfiguro komponentët e UI
  setupMobileMenu();
  setupLazyLoading();
  setupScrollAnimations();
  setupEnhancedTooltips();
  
  // Kontrollo statusin e autentifikimit dhe përditëso UI-në në përputhje
  await updateNavbar();

  // Ngarko listën e kategorive për dropdown
  loadCategories();

  // Ngarko postimet e fundit
  await loadLatestPosts();
  
  // Konfiguro ndërveprimet e përmirësuara
  setupEnhancedInteractions();
  
  // Kontrollo mesazhet nga faqet e tjera (suksesi i hyrjes, etj.)
  checkLoginSuccess();
  checkRedirection();
});

/**
 * Sistemi i Përmirësuar i Tooltip - RREGULLUAR për të gjitha shfletuesit
 */
function setupEnhancedTooltips() {
  let tooltipTimeout;
  
  // Polyfill për metodën closest
  function findClosest(element, selector) {
    if (!element || element === document) return null;
    
    if (element.matches && element.matches(selector)) {
      return element;
    } else if (element.msMatchesSelector && element.msMatchesSelector(selector)) {
      return element;
    } else if (element.webkitMatchesSelector && element.webkitMatchesSelector(selector)) {
      return element;
    }
    
    // Kontrollo nëse elementi ka klasën
    if (selector.startsWith('.')) {
      const className = selector.substring(1);
      if (element.classList && element.classList.contains(className)) {
        return element;
      }
    }
    
    return findClosest(element.parentElement, selector);
  }
  
  // Trajtimi i tooltip për butonat e çaktivizuar - RREGULLUAR delegimi i eventit
  document.addEventListener('mouseenter', (e) => {
    const disabledButton = findClosest(e.target, '.disabled-button');
    if (disabledButton) {
      clearTimeout(tooltipTimeout);
      showEnhancedTooltip(e, 'Please log in to share your travel story and connect with our community');
    }
  }, true);
  
  document.addEventListener('mouseleave', (e) => {
    const disabledButton = findClosest(e.target, '.disabled-button');
    if (disabledButton) {
      tooltipTimeout = setTimeout(() => {
        hideEnhancedTooltip();
      }, 100);
    }
  }, true);
  
  // Trajtimi i lëvizjes së tooltip
  document.addEventListener('mousemove', (e) => {
    const disabledButton = findClosest(e.target, '.disabled-button');
    if (disabledButton) {
      updateTooltipPosition(e);
    }
  });
}

function showEnhancedTooltip(event, text) {
  let tooltip = document.getElementById('tooltip');
  if (!tooltip) {
    // Krijo elementin tooltip nëse nuk ekziston
    tooltip = document.createElement('div');
    tooltip.id = 'tooltip';
    tooltip.className = 'tooltip';
    tooltip.innerHTML = '<div class="tooltip-text"></div>';
    document.body.appendChild(tooltip);
  }
  
  const tooltipText = tooltip.querySelector('.tooltip-text');
  if (tooltipText) {
    tooltipText.textContent = text;
  }
  
  tooltip.style.display = 'block';
  tooltip.style.opacity = '0';
  
  // Poziciono tooltip
  updateTooltipPosition(event);
  
  // Animo hyrjen
  setTimeout(() => {
    tooltip.style.opacity = '1';
    tooltip.classList.add('tooltip-visible');
  }, 10);
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('tooltip');
  if (!tooltip) return;
  
  const rect = tooltip.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let left = event.clientX - (rect.width / 2);
  let top = event.clientY - rect.height - 15;
  
  // Mbaj tooltip brenda kufijve të viewport
  if (left < 10) left = 10;
  if (left + rect.width > viewportWidth - 10) {
    left = viewportWidth - rect.width - 10;
  }
  
  if (top < 10) {
    top = event.clientY + 15; // Shfaq nën cursor
    tooltip.classList.add('tooltip-below');
  } else {
    tooltip.classList.remove('tooltip-below');
  }
  
  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
}

function hideEnhancedTooltip() {
  const tooltip = document.getElementById('tooltip');
  if (tooltip) {
    tooltip.style.opacity = '0';
    tooltip.classList.remove('tooltip-visible');
    setTimeout(() => {
      tooltip.style.display = 'none';
    }, 200);
  }
}

/**
 * Funksionet e Përmirësuara të Konfigurimit të UI
 */

// Konfiguro ndërveprimet e përmirësuara për butonat dhe seksionet
function setupEnhancedInteractions() {
  // Butonat e seksionit hero
  const exploreStoriesBtn = document.getElementById("exploreStoriesBtn");
  
  // Butoni "Explore Stories" - lëvizje e butë drejt historive të fundit
  if (exploreStoriesBtn) {
    exploreStoriesBtn.addEventListener("click", () => {
      const latestStoriesSection = document.querySelector('.latest-stories');
      if (latestStoriesSection) {
        latestStoriesSection.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
        
        // Shto efekt të lehtë theksimi
        setTimeout(() => {
          latestStoriesSection.classList.add('highlight-section');
          setTimeout(() => {
            latestStoriesSection.classList.remove('highlight-section');
          }, 2000);
        }, 500);
      }
    });
  }
  
  // Abonimi në newsletter
  setupNewsletterSubscription();
  
  // Konfiguro efektet hover të kartave të veprimit
  setupActionCardsEffects();
}

// Konfiguro funksionalitetin e abonimit në newsletter
function setupNewsletterSubscription() {
  const subscribeBtn = document.querySelector('.btn-newsletter');
  const emailInput = document.getElementById('emailInput');
  
  if (subscribeBtn && emailInput) {
    subscribeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      
      if (!email) {
        showNotification('Please enter your email address', 'warning');
        emailInput.focus();
        return;
      }
      
      if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        emailInput.focus();
        return;
      }
      
      // Simulo abonimin në newsletter (zëvendëso me thirrjen aktuale të API)
      subscribeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subscribing...';
      subscribeBtn.disabled = true;
      
      setTimeout(() => {
        showNotification('Thank you for subscribing! Welcome to our travel community.', 'success');
        emailInput.value = '';
        subscribeBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Subscribe';
        subscribeBtn.disabled = false;
      }, 1500);
    });
    
    // Mbështetje për çelësin Enter në input email
    emailInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        subscribeBtn.click();
      }
    });
  }
}

// Konfiguro efektet hover të kartave të veprimit
function setupActionCardsEffects() {
  const actionCards = document.querySelectorAll('.action-card');
  
  actionCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-8px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0) scale(1)';
    });
  });
}

// Konfiguro animimet e scroll
function setupScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, observerOptions);
  
  // Observo elementët për animim
  const animateElements = document.querySelectorAll('.benefit-card, .action-card, .testimonial-card');
  animateElements.forEach(el => {
    observer.observe(el);
  });
}

/**
 * Funksionet e Ngarkimit të Postimeve
 */

// Ngarko postimet e fundit nga API
async function loadLatestPosts() {
  const postsContainer = document.getElementById("latestPostsContainer");
  if (!postsContainer) return;

  showLoader("latest-posts");

  try {
    console.log("Po ngarkon postimet e fundit nga API...");
    
    // Merr 6 postime nga endpoint GetRecentPosts
    const response = await fetch(`${API_BASE_URL}/Blog/GetRecentPosts?count=6`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log("Response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch posts (Status: ${response.status})`);
    }
    
    const posts = await response.json();
    console.log("Të dhënat e postimeve u morën:", posts);
    
    // Përpuno dhe shfaq postimet me animime të përmirësuara
    await processAndDisplayPosts(posts, postsContainer);
    
    // Shto animim stagger në kartat e postimeve
    addStaggerAnimation();
    
    // PËRMIRËSUAR SEO: Shto aria-labels në lidhjet read-more të krijuara dinamikisht
    improvePostLinkAccessibility();
    
  } catch (error) {
    console.error("Gabim në ngarkimin e postimeve:", error);
    hideLoader("latest-posts");
    
    if (postsContainer) {
      postsContainer.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-circle"></i> 
          <h3>Oops! Something went wrong</h3>
          <p>We couldn't load the latest stories right now. Please try again later.</p>
          <button onclick="loadLatestPosts()" class="btn btn-retry">
            <i class="fas fa-refresh"></i> Try Again
          </button>
        </div>`;
    }
  }
}

// PËRMIRËSUAR SEO: Funksioni për të përmirësuar aksesueshmërinë e lidhjeve
function improvePostLinkAccessibility() {
  document.querySelectorAll('.read-more').forEach(link => {
    // Përdor funksionin tonë të personalizuar findClosest
    function findPostCard(element) {
      while (element && element !== document) {
        if (element.className && element.className.indexOf('post-card') !== -1) {
          return element;
        }
        element = element.parentElement;
      }
      return null;
    }
    
    const postCard = findPostCard(link);
    if (postCard) {
      const titleElement = postCard.querySelector('.post-title');
      if (titleElement && titleElement.textContent) {
        const postTitle = titleElement.textContent.trim();
        link.setAttribute('aria-label', `Read the full travel story: ${postTitle}`);
      }
    }
  });
}

// Shto animim stagger në kartat e postimeve
function addStaggerAnimation() {
  const postCards = document.querySelectorAll('.posts-showcase > *');
  postCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
    card.classList.add('fade-in-up');
  });
}

// Përpuno dhe shfaq postimet në paraqitjen origjinale 3+3 grid
async function processAndDisplayPosts(posts, container) {
  hideLoader("latest-posts");
  
  if (!posts || posts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-compass"></i>
        <h3>No adventures yet!</h3>
        <p>Be the first to share your travel experience in Albania and inspire others.</p>
        <button id="emptyStateCreateBtn" class="btn btn-primary">
          <i class="fas fa-plus"></i> Share Your Story
        </button>
      </div>`;
    
    // Konfiguro butonin e gjendjes së zbrazët
    const emptyStateBtn = document.getElementById('emptyStateCreateBtn');
    if (emptyStateBtn) {
      updateCreatePostButton(emptyStateBtn, 'create.html');
    }
    
    return;
  }
  
  console.log("Po përpunon të dhënat e postimeve:", posts);
  
  // Rendit postimet sipas datës (më të rejat së pari)
  posts.sort((a, b) => {
    const dateA = new Date(a.createdAt || a.publishAt || 0);
    const dateB = new Date(b.createdAt || b.publishAt || 0);
    return dateB - dateA;
  });
  
  // Pastro kontejnerin
  container.innerHTML = "";
  
  // Paraqitja origjinale: 6 postime në 3+3 grid (2 radhë me 3 postime secila)
  for (let i = 0; i < Math.min(posts.length, 6); i++) {
    await createPostCard(posts[i], container, document.getElementById('compactPostTemplate'), 'compact');
  }
}

// Krijo një kartë postimi bazuar në template
async function createPostCard(post, container, template, type) {
  if (!template) {
    console.error(`Template nuk u gjet për kartën e postimit ${type}`);
    return;
  }
  
  // Klono template
  const postElement = document.importNode(template.content, true);
  
  // Merr ID-në e postimit
  const postId = post.id || post.guid || '';
  if (!postId) {
    console.error("Postimi nuk ka ID", post);
    return;
  }
  
  // Merr informacionin e autorit me thirrje API nëse është e nevojshme
  const authorId = getAuthorId(post);
  let authorName = 'Anonymous';
  let authorImage = DEFAULT_AVATAR;
  
  if (authorId) {
    try {
      // Merr profilin e autorit
      const authorData = await fetchAuthorProfile(authorId);
      if (authorData) {
        authorName = `${authorData.firstName || ''} ${authorData.lastName || ''}`.trim() || authorData.email || 'Anonymous';
        authorImage = authorData.profileImageUrl || DEFAULT_AVATAR;
      }
    } catch (error) {
      console.error(`Gabim në marrjen e të dhënave të autorit për postimin ${post.title}:`, error);
    }
  } else if (post.author) {
    // Përpiqu të përdorësh të dhënat e autorit nga objekti i postimit
    authorName = `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() || post.author.email || 'Anonymous';
    authorImage = post.author.profileImageUrl || DEFAULT_AVATAR;
  }
  
  // Formato datën e postimit
  const postDate = new Date(post.createdAt || post.publishAt || new Date());
  const formattedDate = postDate.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  
  // Merr emrin e kategorisë
  let categoryName = 'Uncategorized';
  if (post.categories && post.categories.length > 0) {
    categoryName = post.categories[0].name;
  }
  
  // Krijo përshkrimin e postimit (vetëm për kartat e veçanta dhe të gjera)
  let excerpt = '';
  if (type !== 'compact' && post.content) {
    const excerptLength = type === 'featured' ? 200 : 100;
    excerpt = post.content.substring(0, excerptLength) + (post.content.length > excerptLength ? '...' : '');
  }
  
  // Vendos vlerat në template
  const postImage = postElement.querySelector('.post-image img');
  if (postImage) {
    postImage.src = post.imageUrl || DEFAULT_POST_IMAGE;
    postImage.alt = post.title || `${type} post thumbnail`;
    postImage.onerror = function() { this.src = DEFAULT_POST_IMAGE; };
  }
  
  const postCategory = postElement.querySelector('.post-category');
  if (postCategory) postCategory.textContent = categoryName;
  
  const postTitle = postElement.querySelector('.post-title');
  if (postTitle) postTitle.textContent = post.title || 'Untitled Post';
  
  const authorAvatar = postElement.querySelector('.author-avatar img');
  if (authorAvatar) {
    authorAvatar.src = authorImage;
    authorAvatar.alt = authorName;
    authorAvatar.onerror = function() { this.src = DEFAULT_AVATAR; };
  }
  
  const authorNameEl = postElement.querySelector('.author-name');
  if (authorNameEl) authorNameEl.textContent = authorName;
  
  const postDateEl = postElement.querySelector('.post-date');
  if (postDateEl) postDateEl.textContent = formattedDate;
  
  // Vendos përshkrimin për postimet e veçanta dhe të gjera
  if (type !== 'compact') {
    const excerptElement = postElement.querySelector('.post-excerpt');
    if (excerptElement) {
      excerptElement.textContent = excerpt || 'No content available';
    }
  }
  
  const readMoreLink = postElement.querySelector('.read-more');
  if (readMoreLink) {
    readMoreLink.href = `singlepost.html?id=${encodeURIComponent(postId)}`;
    // PËRMIRËSUAR SEO: Shto aria-label përshkruese
    if (post.title) {
      readMoreLink.setAttribute('aria-label', `Read the full travel story: ${post.title}`);
    }
  }
  
  // Bëj elementët e autorit të klikueshëm nëse ekziston ID e autorit
  if (authorId) {
    const authorAvatarContainer = postElement.querySelector('.author-avatar');
    const authorNameElement = postElement.querySelector('.author-name');
    
    if (authorAvatarContainer) {
      authorAvatarContainer.classList.add('clickable');
      authorAvatarContainer.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = `author.html?id=${encodeURIComponent(authorId)}`;
      });
    }
    
    if (authorNameElement) {
      authorNameElement.classList.add('clickable');
      authorNameElement.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = `author.html?id=${encodeURIComponent(authorId)}`;
      });
    }
  }
  
  // Shto postimin në kontejner
  container.appendChild(postElement);
  
  // Bëj kartën e klikueshme me efekte hover të përmirësuara
  const card = container.querySelector(`[class*="${type}-post-card"]:last-child`);
  if (card) {
    card.style.cursor = 'pointer';
    
    // Efekt hover i përmirësuar
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-8px)';
      card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = '';
    });
    
    card.addEventListener('click', (e) => {
      // Kontrollo nëse elementi i klikuar është read-more ose elementët e autorit
      let isSpecialElement = false;
      
      if (e.target.classList.contains('read-more') || 
          e.target.classList.contains('author-name')) {
        isSpecialElement = true;
      }
      
      // Kontrollo për avatar të autorit duke përdorur traversimin e prindit
      let element = e.target;
      while (element && element !== card) {
        if (element.className && element.className.indexOf('author-avatar') !== -1) {
          isSpecialElement = true;
          break;
        }
        element = element.parentElement;
      }
      
      if (!isSpecialElement) {
        window.location.href = `singlepost.html?id=${encodeURIComponent(postId)}`;
      }
    });
  }
}

/**
 * Funksionet e Autorit dhe Profilit
 */

async function fetchAuthorProfile(authorId) {
  if (authorCache.has(authorId)) {
    return authorCache.get(authorId);
  }
  
  try {
    console.log(`Po ngarkon profilin e autorit për ID: ${authorId}`);
    const response = await fetch(`${API_BASE_URL}/Users/author-profile/${authorId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch author profile (Status: ${response.status})`);
    }
    
    const authorData = await response.json();
    console.log("Të dhënat e autorit u morën:", authorData);
    
    authorCache.set(authorId, authorData);
    return authorData;
  } catch (error) {
    console.error("Gabim në ngarkimin e profilit të autorit:", error);
    return null;
  }
}

function getAuthorId(post) {
  if (post.userId) return post.userId;
  if (post.authorId) return post.authorId;
  if (post.author && post.author.id) return post.author.id;
  return null;
}

async function fetchUserProfile() {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) return null;
  
  try {
    const response = await fetch(`${API_BASE_URL}/Users/my-profile-with-posts`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        updateNavbar();
        return null;
      }
      throw new Error("Failed to fetch profile");
    }
    
    const userData = await response.json();
    localStorage.setItem("userProfile", JSON.stringify(userData));
    return userData;
  } catch (error) {
    console.error("Gabim në ngarkimin e profilit të përdoruesit:", error);
    return null;
  }
}

/**
 * Funksionet e Përmirësuara të UI dhe Navigimit
 */

async function updateNavbar() {
  const loginLogoutBtn = document.getElementById("loginLogoutBtn");
  const registerItem = document.getElementById("registerItem");
  const profileItem = document.getElementById("profileItem");
  
  if (!loginLogoutBtn) return;
  
  const isLoggedIn = localStorage.getItem("accessToken") !== null;

  if (isLoggedIn) {
    loginLogoutBtn.textContent = "Logout";
    loginLogoutBtn.href = "#";
    
    if (registerItem) registerItem.style.display = "none";
    if (profileItem) profileItem.style.display = "list-item";

    const newBtn = loginLogoutBtn.cloneNode(true);
    loginLogoutBtn.parentNode.replaceChild(newBtn, loginLogoutBtn);

    document.getElementById("loginLogoutBtn").addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userProfile");
      showNotification("You have been logged out successfully.", "success");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    });
    
    const userProfile = await fetchUserProfile();
    if (userProfile && profileItem) {
      const profileLink = profileItem.querySelector('a');
      if (profileLink) {
        const fullName = `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim();
        profileLink.innerHTML = `<i class="fas fa-user-circle"></i> ${fullName || userProfile.email || 'My Profile'}`;
      }
    }
  } else {
    loginLogoutBtn.textContent = "Login";
    loginLogoutBtn.href = "login.html";
    
    if (registerItem) registerItem.style.display = "list-item";
    if (profileItem) profileItem.style.display = "none";

    const newBtn = loginLogoutBtn.cloneNode(true);
    loginLogoutBtn.parentNode.replaceChild(newBtn, loginLogoutBtn);
  }
  
  updateCreatePostButtons();
}

function updateCreatePostButtons() {
  const createPostBtn = document.getElementById("createPostBtn");
  const ctaCreatePostBtn = document.getElementById("ctaCreatePostBtn");
  const ctaSignUpBtn = document.getElementById("ctaSignUpBtn");
  const isLoggedIn = localStorage.getItem("accessToken") !== null;
  
  // Përditëso butonin e krijimit të postimit
  updateCreatePostButton(createPostBtn, "create.html");
  updateCreatePostButton(ctaCreatePostBtn, "create.html");
  
  // Përditëso butonin e regjistrimit
  if (ctaSignUpBtn) {
    const newBtn = ctaSignUpBtn.cloneNode(true);
    ctaSignUpBtn.parentNode.replaceChild(newBtn, ctaSignUpBtn);
    const refreshedBtn = document.getElementById("ctaSignUpBtn");
    
    if (isLoggedIn) {
      refreshedBtn.innerHTML = '<i class="fas fa-edit"></i> Share Your Story';
      refreshedBtn.title = "Create a new post";
      refreshedBtn.addEventListener("click", () => {
        window.location.href = "create.html";
      });
    } else {
      refreshedBtn.innerHTML = '<i class="fas fa-user-plus"></i> Sign Up Now';
      refreshedBtn.title = "Sign up to join our community";
      refreshedBtn.addEventListener("click", () => {
        sessionStorage.setItem("redirectAfterLogin", "create.html");
        window.location.href = "register.html";
      });
    }
  }
  
  // Shfaq/fshih mesazhet e kërkesës për hyrje
  showLoginRequiredMessages(!isLoggedIn);
}

function showLoginRequiredMessages(show) {
  const loginRequiredMessage = document.getElementById("loginRequiredMessage");
  const ctaLoginRequiredMessage = document.getElementById("ctaLoginRequiredMessage");
  
  if (loginRequiredMessage) {
    loginRequiredMessage.style.display = show ? "flex" : "none";
  }
  
  if (ctaLoginRequiredMessage) {
    ctaLoginRequiredMessage.style.display = show ? "flex" : "none";
  }
}

function updateCreatePostButton(button, targetPage) {
  if (!button) return;
  
  const isLoggedIn = localStorage.getItem("accessToken") !== null;
  const newBtn = button.cloneNode(true);
  button.parentNode.replaceChild(newBtn, button);
  const refreshedBtn = document.getElementById(newBtn.id);
  
  if (!refreshedBtn) return;
  
  if (!isLoggedIn) {
    refreshedBtn.classList.add("disabled-button");
    refreshedBtn.title = "Please login to create and share your travel story";
    refreshedBtn.addEventListener("click", showLoginDialog);
  } else {
    refreshedBtn.classList.remove("disabled-button");
    refreshedBtn.title = "Create a new post";
    refreshedBtn.addEventListener("click", () => {
      window.location.href = targetPage;
    });
  }
}

function showLoginDialog(e) {
  e.preventDefault();
  
  const modal = document.getElementById("loginDialogModal");
  const closeModal = document.querySelector(".close-modal");
  const cancelBtn = document.getElementById("cancelLoginBtn");
  const proceedBtn = document.getElementById("proceedLoginBtn");
  
  if (!modal) {
    console.error("Modali i dialogut të hyrjes nuk u gjet");
    return;
  }
  
  modal.style.display = "block";
  document.body.style.overflow = "hidden"; // Parandalon scroll-in e sfondit
  
  if (closeModal) {
    closeModal.onclick = () => {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
    };
  }
  
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
    };
  }
  
  if (proceedBtn) {
    proceedBtn.onclick = () => {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
      sessionStorage.setItem("redirectAfterLogin", "create.html");
      window.location.href = "login.html";
    };
  }
  
  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
    }
  };
}

/**
 * Funksionet e Kategorive
 */

function loadCategories() {
  const categoryList = document.getElementById("categoryList");
  if (!categoryList) return;
  
  categoryList.innerHTML = '<li class="dropdown-placeholder">Loading categories...</li>';
  
  fetch(`${API_BASE_URL}/Blog/GetAllCategories`)
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to load categories");
      }
      return response.json();
    })
    .then(categories => {
      categoryList.innerHTML = "";
      
      if (!categories || categories.length === 0) {
        categoryList.innerHTML = '<li><span>No categories available</span></li>';
        return;
      }
      
      categories.sort((a, b) => a.name.localeCompare(b.name));
      
      categories.forEach(category => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="categories.html?id=${category.id}&name=${encodeURIComponent(category.name)}">${category.name}</a>`;
        categoryList.appendChild(li);
      });
    })
    .catch(error => {
      console.error("Gabim në ngarkimin e kategorive:", error);
      categoryList.innerHTML = '<li><span>Error loading categories</span></li>';
    });
}

/**
 * Funksionet Ndihmëse
 */

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function showLoader(containerId) {
  const loaderId = `${containerId}-loader`;
  let loader = document.getElementById(loaderId);
  
  if (!loader) {
    const container = document.getElementById(containerId) || 
                     document.querySelector(`.${containerId}`) || 
                     document.querySelector(`#${containerId}Container`);
    
    if (container) {
      loader = document.createElement('div');
      loader.className = 'loading';
      loader.id = loaderId;
      loader.innerHTML = '<div class="spinner"></div><p>Loading...</p>';
      container.appendChild(loader);
    }
  }
}

function hideLoader(containerId) {
  const loader = document.getElementById(`${containerId}-loader`);
  if (loader) {
    loader.remove();
  }
}

function showNotification(message, type = 'info') {
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
    `;
    document.body.appendChild(container);
  }
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  let icon = 'info-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'error') icon = 'exclamation-circle';
  if (type === 'warning') icon = 'exclamation-triangle';
  
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${icon}"></i>
      <span>${message}</span>
      <button class="close-btn">&times;</button>
    </div>
  `;
  
  // Shto stilet bazë për njoftimin
  notification.style.cssText = `
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
    color: white;
    padding: 12px 20px;
    margin-bottom: 10px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
  `;
  
  container.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 10);
  
  const closeBtn = notification.querySelector('.close-btn');
  if (closeBtn) {
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      margin-left: 10px;
      padding: 0;
    `;
    closeBtn.addEventListener('click', () => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 300);
    });
  }
  
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 300);
    }
  }, 5000);
}

function setupMobileMenu() {
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      menuToggle.setAttribute('aria-expanded', 
        menuToggle.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'
      );
    });
    
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && 
          !menuToggle.contains(e.target) && 
          navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
    
    const dropdownTriggers = document.querySelectorAll('.dropdown-trigger');
    dropdownTriggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          const dropdown = trigger.closest('.dropdown');
          if (dropdown) {
            dropdown.classList.toggle('active');
          }
        }
      });
    });
  }
}

function setupLazyLoading() {
  if ('loading' in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img:not([loading])');
    images.forEach(img => {
      img.setAttribute('loading', 'lazy');
    });
  } else {
    // Fallback për shfletuesit që nuk mbështesin native lazy loading
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });
    
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => imageObserver.observe(img));
  }
}

function checkRedirection() {
  const redirectPath = sessionStorage.getItem('redirectAfterLogin');
  if (redirectPath && localStorage.getItem('accessToken')) {
    sessionStorage.removeItem('redirectAfterLogin');
    window.location.href = redirectPath;
  }
}

function checkLoginSuccess() {
  const justLoggedIn = sessionStorage.getItem('justLoggedIn');
  if (justLoggedIn) {
    sessionStorage.removeItem('justLoggedIn');
    showNotification('Welcome! You have logged in successfully.', 'success');
  }
}