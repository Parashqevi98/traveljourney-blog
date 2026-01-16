// Fajlli kryesor author.js për të trajtuar funksionalitetin e faqes së profilit të autorit

// Inicializon kur faqja ngarkohet
document.addEventListener('DOMContentLoaded', async function() {
    console.log("Faqja e autorit u ngarkua, duke inicializuar...");
    
    // Inicializon faqen
    setupMobileMenu();
    await updateNavbar(); // Përdor async/await për përditësimin e navbar
    loadCategories();
    setupLoginDialog();
    
    // Ngarkon profilin dhe postimet e autorit
    await loadAuthorProfile();
    
    // Kontrollon nëse duhet të shfaqë mesazhin e mirëseardhjes ose të trajtojë ridrejtimet
    checkLoginSuccess();
    checkRedirection();
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
    const profileItem = document.getElementById("profileItem");
    const registerItem = document.getElementById("registerItem");
    const userNameDisplay = document.getElementById("userNameDisplay");
    
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
            
            // Shfaq butonin e regjistimit kur nuk është i loguar
            if (registerItem) registerItem.style.display = "list-item";
            
            // Fsheh butonin e profilit kur nuk është i loguar
            if (profileItem) profileItem.style.display = "none";
            
            // Heq click handlers
            const newBtn = loginLogoutBtn.cloneNode(true);
            loginLogoutBtn.parentNode.replaceChild(newBtn, loginLogoutBtn);
        }
    }
}

// Funksioni për të marrë të dhënat e profilit të përdoruesit
async function fetchUserProfile() {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return null;
    
    try {
        // Kontrollon nëse kemi të dhëna profili në localStorage
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

// Funksioni për të ngarkuar kategoritë
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
            categoryList.innerHTML = '';
            categories.forEach(category => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = `posts.html?category=${category.id}`;
                a.textContent = category.name;
                li.appendChild(a);
                categoryList.appendChild(li);
            });
            return;
        } catch (error) {
            console.error("Gabim në analizimin e kategorive të ruajtura:", error);
            // Vazhdon për të marrë kategori të reja
        }
    }
    
    fetch("https://localhost:7059/api/Blog/GetAllCategories")
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }
            return response.json();
        })
        .then(categories => {
            // Ruaj kategoritë në cache
            localStorage.setItem('cachedCategories', JSON.stringify(categories));
            localStorage.setItem('categoriesCacheTime', currentTime.toString());
            
            categoryList.innerHTML = '';
            categories.forEach(category => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = `posts.html?category=${category.id}`;
                a.textContent = category.name;
                li.appendChild(a);
                categoryList.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Gabim në ngarkimin e kategorive:', error);
            categoryList.innerHTML = '<li><a href="#">Error loading categories</a></li>';
        });
}

// Ngarkon informacionin e profilit të autorit nga API
async function loadAuthorProfile() {
    console.log("Duke ngarkuar profilin e autorit...");
    
    try {
        // Merr ID e autorit nga parametrat e URL
        const urlParams = new URLSearchParams(window.location.search);
        const authorId = urlParams.get('id');
        
        if (!authorId) {
            throw new Error('No author ID provided in URL');
        }
        
        console.log("ID e autorit:", authorId);
        
        // Përditëson titullin e faqes
        document.title = "Author Profile - TravelJourney";
        
        // Merr të dhënat e profilit të autorit
        const response = await fetch(`https://localhost:7059/api/Users/author-profile/${authorId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch author profile (Status: ${response.status})`);
        }
        
        const authorData = await response.json();
        console.log("Të dhënat e autorit:", authorData);
        
        // Përditëson DOM me informacionin e autorit
        displayAuthorProfile(authorData);
        
        // Ngarkon postimet e autorit
        loadAuthorPosts(authorId);
        
    } catch (error) {
        console.error("Gabim në ngarkimin e profilit të autorit:", error);
        showError("Failed to load author profile. " + error.message);
    }
}

// Shfaq të dhënat e profilit të autorit në faqe
function displayAuthorProfile(author) {
    // Merr elementët e DOM
    const authorName = document.getElementById('authorName');
    const authorImage = document.getElementById('authorImage');
    const authorLocation = document.getElementById('authorLocation');
    const authorJoinDate = document.getElementById('authorJoinDate');
    const authorDescription = document.getElementById('authorDescription');
    
    // Përditëson titullin e faqes me emrin e autorit
    document.title = `${author.firstName} ${author.lastName} - TravelJourney`;
    
    // Përditëson emrin e autorit
    if (authorName) {
        authorName.textContent = `${author.firstName} ${author.lastName}`;
    }
    
    // Përditëson foton e autorit
    if (authorImage) {
        authorImage.src = author.profileImageUrl || 'images/default-avatar.jpg';
        authorImage.alt = `${author.firstName} ${author.lastName}`;
        
        // Shton handler për gabimin e fotos
        authorImage.onerror = function() {
            this.src = 'images/default-avatar.jpg';
        };
    }
    
    // Përditëson vendndodhjen e autorit
    if (authorLocation) {
        if (author.location && author.location.trim() !== '') {
            authorLocation.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${author.location}`;
        } else {
            authorLocation.innerHTML = `<i class="fas fa-map-marker-alt"></i> Location not specified`;
        }
    }
    
    // Formaton dhe përditëson datën e anëtarësimit
    if (authorJoinDate) {
        let joinDateText = 'Join date not available';
        
        if (author.joinedDate) {
            const joinDate = new Date(author.joinedDate);
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            joinDateText = joinDate.toLocaleDateString('en-US', options);
        }
        
        authorJoinDate.innerHTML = `<i class="fas fa-calendar-alt"></i> Joined: ${joinDateText}`;
    }
    
    // Përditëson përshkrimin e autorit
    if (authorDescription) {
        if (author.description && author.description.trim() !== '') {
            authorDescription.textContent = author.description;
        } else {
            authorDescription.textContent = 'This author has not added a biography yet.';
        }
    }
}

// Ngarkon postimet e autorit
async function loadAuthorPosts(authorId) {
    const postsContainer = document.getElementById('authorPosts');
    
    try {
        // Shfaq indikatorin e ngarkimit
        showLoader('authorPosts');
        
        // Merr postimet e autorit
        const postsResponse = await fetch(`https://localhost:7059/api/Blog/GetPostsByAuthor/${authorId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        
        if (!postsResponse.ok) {
            throw new Error('Failed to load author posts');
        }
        
        const postsData = await postsResponse.json();
        console.log("Të dhënat e postimeve të autorit:", postsData);
        
        hideLoader('authorPosts');
        
        // Pastron kontejnerin dhe kontrollon nëse kemi postime
        postsContainer.innerHTML = '';
        
        if (!postsData || postsData.length === 0) {
            postsContainer.innerHTML = '<p class="no-posts-message">This author has not published any posts yet.</p>';
            return;
        }
        
        // Shfaq postimet
        postsData.forEach(post => {
            // Formaton datën
            const postDate = new Date(post.publishAt || post.createdAt);
            const formattedDate = postDate.toLocaleDateString("en-US", {
                day: "numeric",
                month: "long",
                year: "numeric"
            });
            
            // Merr emrin e kategorisë nëse është i disponueshëm
            let categoryName = 'Uncategorized';
            if (post.categories && post.categories.length > 0) {
                categoryName = post.categories[0].categoryName || post.categories[0].name;
            }
            
            // Përdor përmbajtjen si përshkrim, duke e kufizuar në 100 karaktere
            const shortContent = post.content ? post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '') : 'No content available';
            
            // Krijon elementin e kartës së postimit
            const postCard = document.createElement("div");
            postCard.className = "post-card-small";
            
            // Krijon strukturën HTML të postimit
            postCard.innerHTML = `
                <div class="post-image">
                    <img src="${post.imageUrl || 'images/placeholder.jpg'}" alt="${post.title}" 
                         onerror="this.src='images/placeholder.jpg'" loading="lazy">
                </div>
                <div class="post-content">
                    <span class="post-category">${categoryName}</span>
                    <h3>${post.title || 'Untitled'}</h3>
                    <div class="post-date">
                        <i class="far fa-calendar-alt"></i> ${formattedDate}
                    </div>
                    <p>${shortContent}</p>
                    <a href="singlepost.html?id=${encodeURIComponent(post.id)}" class="read-more">Read More...</a>
                </div>
            `;
            
            // E bën kartën e postimit të klikueshme përveç linkut "lexo më shumë"
            postCard.addEventListener('click', (e) => {
                if (!e.target.classList.contains('read-more')) {
                    window.location.href = `singlepost.html?id=${encodeURIComponent(post.id)}`;
                }
            });
            
            postCard.style.cursor = 'pointer';
            postsContainer.appendChild(postCard);
        });
        
    } catch (error) {
        console.error("Gabim në ngarkimin e postimeve të autorit:", error);
        hideLoader('authorPosts');
        postsContainer.innerHTML = '<p class="error-message">Error loading posts. Please try again later.</p>';
    }
}

// Funksioni për të shfaqur mesazhin e gabimit
function showError(message) {
    // Shfaq njoftimin e gabimit
    showNotification(message, 'error');
    
    // Përditëson elementët e DOM me mesazhet e gabimit
    const authorName = document.getElementById('authorName');
    const authorLocation = document.getElementById('authorLocation');
    const authorJoinDate = document.getElementById('authorJoinDate');
    const authorDescription = document.getElementById('authorDescription');
    const postsContainer = document.getElementById('authorPosts');
    
    if (authorName) authorName.textContent = 'Author not found';
    if (authorLocation) authorLocation.innerHTML = '<i class="fas fa-map-marker-alt"></i> Not available';
    if (authorJoinDate) authorJoinDate.innerHTML = '<i class="fas fa-calendar-alt"></i> Not available';
    if (authorDescription) authorDescription.textContent = 'Cannot load author information. Please try again later.';
    
    if (postsContainer) {
        hideLoader('authorPosts');
        postsContainer.innerHTML = '<p class="error-message">Cannot load author posts.</p>';
    }
}

// Funksioni për të shfaqur/fshehur loader-in
function showLoader(containerId) {
    const loader = document.getElementById(`${containerId}-loader`);
    if (loader) {
        loader.style.display = 'block';
    }
}

function hideLoader(containerId) {
    const loader = document.getElementById(`${containerId}-loader`);
    if (loader) {
        loader.style.display = 'none';
    }
}

// Konfigurimi i dialogut modal të login
function setupLoginDialog() {
    const modal = document.getElementById("loginDialogModal");
    const closeModal = document.querySelector(".close-modal");
    const cancelBtn = document.getElementById("cancelLoginBtn");
    const proceedBtn = document.getElementById("proceedLoginBtn");
    
    if (!modal) return;
    
    // Ngjarjet për mbylljen e modal
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
    
    // Mbyll nëse klikohet jashtë modal
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };
}

// Funksioni për të shfaqur dialogun e login
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