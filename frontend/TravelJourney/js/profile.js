// Variabla globale
let currentUser = null;
let activeTab = 'my-posts';

// Rregullat e validimit për formën e profilit
const profileValidationRules = {
  firstName: {
    required: true,
    label: 'First Name',
    minLength: 2
  },
  lastName: {
    required: true,
    label: 'Last Name',
    minLength: 2
  },
  email: {
    required: true,
    label: 'Email',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  description: {
    required: false,
    label: 'Biography'
  },
  location: {
    required: false,
    label: 'Location'
  }
};

// Rregullat e validimit për editimin e postimit
const postValidationRules = {
  postTitle: {
    required: true,
    label: 'Title',
    minLength: 5
  },
  postContent: {
    required: true,
    label: 'Content',
    minLength: 20
  }
};

// Inicializon kur faqja ngarkohet
document.addEventListener("DOMContentLoaded", async () => {
  // Kontrollon nëse përdoruesi është i loguar, ridrejton nëse jo
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    sessionStorage.setItem("redirectAfterLogin", window.location.href);
    window.location.href = "login.html";
    return;
  }
  
  // Merr profilin e përdoruesit me postimet
  await fetchUserProfile();
  
  // Ndryshimi i tab-ave
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-tab'));
    });
  });
  
  // Butoni për editimin e profilit
  const editProfileBtn = document.getElementById('editProfileBtn');
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
      switchTab('account-settings');
    });
  }
  
  // Butoni për editimin e avatar-it
  const editAvatarBtn = document.getElementById('editAvatarBtn');
  if (editAvatarBtn) {
    editAvatarBtn.addEventListener('click', () => {
      showImageUploadModal();
    });
  }
  
  // Forma e përditësimit të profilit
  const profileUpdateForm = document.getElementById('profileUpdateForm');
  if (profileUpdateForm) {
    profileUpdateForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      if (validateForm(profileUpdateForm, profileValidationRules)) {
        const formData = {
          firstName: document.getElementById('firstName').value,
          lastName: document.getElementById('lastName').value,
          description: document.getElementById('description').value,
          location: document.getElementById('location').value,
          facebook: document.getElementById('facebook').value,
          twitter: document.getElementById('twitter').value,
          instagram: document.getElementById('instagram').value
        };
        
        updateProfile(formData);
      }
    });
  }
});

// Funksioni për të validuar formën
function validateForm(formElement, validationRules) {
  const inputs = formElement.querySelectorAll('input, textarea, select');
  let isValid = true;
  
  inputs.forEach(input => {
    const rule = validationRules[input.name];
    if (rule) {
      const errorElement = document.getElementById(`${input.name}-error`);
      if (rule.required && !input.value.trim()) {
        isValid = false;
        if (errorElement) errorElement.textContent = `${rule.label} is required.`;
        input.classList.add('error-input');
      } else if (rule.minLength && input.value.length < rule.minLength) {
        isValid = false;
        if (errorElement) errorElement.textContent = `${rule.label} must be at least ${rule.minLength} characters.`;
        input.classList.add('error-input');
      } else if (rule.pattern && !rule.pattern.test(input.value)) {
        isValid = false;
        if (errorElement) errorElement.textContent = rule.message || `${rule.label} is not in the correct format.`;
        input.classList.add('error-input');
      } else {
        if (errorElement) errorElement.textContent = '';
        input.classList.remove('error-input');
      }
    }
  });
  
  return isValid;
}

// Funksioni për të marrë profilin e përdoruesit me postimet
async function fetchUserProfile() {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    window.location.href = "login.html";
    return;
  }
  
  try {
    showLoader("userPosts");
    
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
        window.location.href = "login.html";
        return;
      }
      throw new Error("Problem fetching profile");
    }
    
    const userData = await response.json();
    currentUser = userData;
    
    // Log të dhënat e përdoruesit për debugging
    console.log("Të dhënat e përdoruesit u morën:", userData);
    
    // Ruaj të dhënat e përdoruesit në localStorage për qasje të shpejtë
    localStorage.setItem("userProfile", JSON.stringify(userData));
    
    // Përditëson UI me të dhënat e përdoruesit
    updateProfileUI(userData);
    
    // Përditëson emrin e përdoruesit në navbar
    updateProfileUsername(userData);
    
    hideLoader("userPosts");
  } catch (error) {
    console.error("Gabim në marrjen e profilit:", error);
    hideLoader("userPosts");
    showNotification("Error loading profile. Please try again later.", "error");
  }
}

// Funksioni për të përditësuar emrin e përdoruesit në navbar
function updateProfileUsername(userData) {
  const userNameDisplay = document.getElementById('userNameDisplay');
  if (userNameDisplay) {
    const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
    userNameDisplay.textContent = fullName || userData.email || 'My Profile';
  }
}

// Funksioni për të përditësuar UI e profilit
function updateProfileUI(userData) {
  console.log("Duke përditësuar UI e profilit me të dhënat:", userData);
  
  // Përditëson avatar-in
  const profileAvatar = document.getElementById('profileAvatar');
  if (profileAvatar) {
    profileAvatar.src = userData.profileImageUrl || '/images/default-avatar.jpg';
    profileAvatar.onerror = () => {
      profileAvatar.src = '/images/default-avatar.jpg';
    };
  }
  
  // Përditëson emrin e përdoruesit/emrin e plotë
  const profileUsername = document.getElementById('profileUsername');
  if (profileUsername) {
    const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
    profileUsername.textContent = fullName || userData.email || 'User';
  }
  
  // Përditëson bio/përshkrimin
  const profileBio = document.getElementById('profileBio');
  if (profileBio) {
    profileBio.textContent = userData.description || 'No biography available';
  }
  
  // Përpunon postimet - E përmirësuar: Përpunon postimet vetëm një herë
  let uniquePosts = [];
  if (userData.posts && Array.isArray(userData.posts) && userData.posts.length > 0) {
    // Heq dublikatat e postimeve sipas ID
    uniquePosts = deduplicatePosts(userData.posts);
    console.log(`Postimet origjinale: ${userData.posts.length}, Pas heqjes së dublikatave: ${uniquePosts.length}`);
  }
  
  // Përditëson numrin e postimeve me numërimin pa dublikata
  const postsCount = document.getElementById('postsCount');
  if (postsCount) {
    postsCount.textContent = uniquePosts.length.toString();
  }
  
  // Ngarkon postimet e përdoruesit - E përmirësuar: E thërret këtë vetëm një herë me postimet pa dublikata
  loadUserPosts(uniquePosts);
  
  // Mbush formën e profilit
  populateProfileForm(userData);
}

// Funksioni për të hequr dublikatat e postimeve sipas ID - Logjikë e përmirësuar
function deduplicatePosts(posts) {
  if (!posts || !Array.isArray(posts)) {
    console.warn("deduplicatePosts mori input të pavlefshëm:", posts);
    return [];
  }
  
  // Krijon një Map për të siguruar unicitëtin sipas ID
  const uniquePostsMap = new Map();
  
  for (const post of posts) {
    if (!post) continue;
    
    // Përdor pronësinë e qëndrueshme të ID (preferon 'id' mbi 'guid')
    const postId = post.id || post.guid;
    
    if (postId && !uniquePostsMap.has(postId)) {
      uniquePostsMap.set(postId, post);
    } else if (postId) {
      console.log(`U gjet postim i dubluar me ID: ${postId}`);
    }
  }
  
  // Konverton Map-in përsëri në array të postimeve unike
  const result = Array.from(uniquePostsMap.values());
  console.log(`Heqja e dublikatave: ${posts.length} -> ${result.length} postime`);
  return result;
}

// Funksioni për të mbushur formën e profilit
function populateProfileForm(userData) {
  const firstNameInput = document.getElementById('firstName');
  const lastNameInput = document.getElementById('lastName');
  const emailInput = document.getElementById('email');
  const descriptionInput = document.getElementById('description');
  const locationInput = document.getElementById('location');
  const facebookInput = document.getElementById('facebook');
  const twitterInput = document.getElementById('twitter');
  const instagramInput = document.getElementById('instagram');
  
  if (firstNameInput) firstNameInput.value = userData.firstName || '';
  if (lastNameInput) lastNameInput.value = userData.lastName || '';
  if (emailInput) emailInput.value = userData.email || '';
  if (descriptionInput) descriptionInput.value = userData.description || '';
  if (locationInput) locationInput.value = userData.location || '';
  
  // Mbush lidhjet e mediave sociale nëse janë të disponueshme
  if (userData.socialMedia) {
    if (facebookInput) facebookInput.value = userData.socialMedia.facebook || '';
    if (twitterInput) twitterInput.value = userData.socialMedia.twitter || '';
    if (instagramInput) instagramInput.value = userData.socialMedia.instagram || '';
  }
}

// Cache globale e kategorive
let categoriesCache = {};

// Funksioni për të marrë të gjitha kategoritë
async function fetchCategories() {
  if (Object.keys(categoriesCache).length > 0) {
    return; // Kategoritë janë tashmë të ngarkuara
  }
  
  try {
    const response = await fetch("https://localhost:7059/api/Blog/GetAllCategories", {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch categories");
    }
    
    const categories = await response.json();
    console.log("Kategoritë u ngarkuan:", categories);
    
    // Konverton array-in në objekt për kërkim më të lehtë
    categories.forEach(category => {
      categoriesCache[category.id] = category.name;
    });
  } catch (error) {
    console.error("Gabim në marrjen e kategorive:", error);
  }
}

// Funksioni për të ngarkuar postimet e përdoruesit - E përmirësuar: Pastron kontejnerin dhe parandalon ngarkimin e dyfishtë
function loadUserPosts(posts) {
  const userPostsContainer = document.getElementById('userPosts');
  if (!userPostsContainer) return;
  
  // Log array-in e postimeve për debugging
  console.log("Duke ngarkuar postimet për të shfaqur:", posts);
  
  // Pastron përmbajtjen e mëparshme plotësisht - E përmirësuar: Kjo parandalon postimet e dubluara
  userPostsContainer.innerHTML = '';
  
  if (!posts || posts.length === 0) {
    const noPostsMessage = document.createElement('div');
    noPostsMessage.className = 'no-posts-message';
    noPostsMessage.textContent = 'You have not created any posts yet.';
    userPostsContainer.appendChild(noPostsMessage);
    return;
  }
  
  // Sigurohet që kategoritë të jenë ngarkuar së pari
  fetchCategories().then(() => {
    // Pastron kontejnerin përsëri për të qenë absolutisht i sigurt
    userPostsContainer.innerHTML = '';
    
    // Përpunon çdo postim saktësisht një herë
    posts.forEach((post, index) => {
      console.log(`Duke përpunuar postimin ${index + 1}/${posts.length}:`, post.id || post.guid);
      const postCard = createPostCard(post);
      userPostsContainer.appendChild(postCard);
    });
    
    console.log(`U shfaqën me sukses ${posts.length} postime unike.`);
  });
}

// Funksioni për të krijuar një kartë postimi
function createPostCard(post) {
  const postCard = document.createElement('div');
  postCard.className = 'post-card-small';
  
  // Merr ID e postimit në mënyrë të qëndrueshme
  const postId = post.id || post.guid;
  
  // Formaton datën
  const postDate = new Date(post.createdAt);
  const formattedDate = postDate.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  
  // Merr emrin e kategorisë
  let categoryName = 'Uncategorized';
  
  // Bazuar në strukturën e API, kontrollon për array-in PostCategories
  if (post.postCategories && post.postCategories.length > 0) {
    const categoryId = post.postCategories[0].categoryGuid || post.postCategories[0].categoryId;
    
    if (categoryId && categoriesCache[categoryId]) {
      categoryName = categoriesCache[categoryId];
    }
  } else if (post.categoryId && categoriesCache[post.categoryId]) {
    categoryName = categoriesCache[post.categoryId];
  } else if (post.category && post.category.name) {
    categoryName = post.category.name;
  }
  
  // Përdor përmbajtjen si përshkrim, duke e kufizuar në 100 karaktere
  const shortContent = post.content ? post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '') : 'No content available';
  
  // Krijon strukturën HTML të postimit
  postCard.innerHTML = `
    <div class="post-actions">
      <button class="post-action-btn edit-btn" data-id="${postId}" title="Edit post">
        <i class="fas fa-edit"></i>
      </button>
      <button class="post-action-btn delete-btn" data-id="${postId}" title="Delete post">
        <i class="fas fa-trash-alt"></i>
      </button>
    </div>
    <div class="post-image">
      <img src="${post.imageUrl || '/images/placeholder.jpg'}" alt="${post.title}" 
           onerror="this.src='/images/placeholder.jpg'" loading="lazy">
    </div>
    <div class="post-content">
      <span class="post-category">${categoryName}</span>
      <h3>${post.title || 'Untitled'}</h3>
      <div class="post-date">${formattedDate}</div>
      <p>${shortContent}</p>
      <a href="singlepost.html?id=${encodeURIComponent(postId)}" class="read-more">Read More</a>
    </div>
  `;
  
  // Shton event listeners për veprimet e postimit
  const editBtn = postCard.querySelector('.edit-btn');
  const deleteBtn = postCard.querySelector('.delete-btn');
  
  if (editBtn) {
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showEditPostModal(post);
    });
  }
  
  if (deleteBtn) {
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showDeleteConfirmation(postId);
    });
  }
  
  // E bën kartën e postimit të klikueshme
  postCard.addEventListener('click', (e) => {
    if (!e.target.closest('.post-actions') && !e.target.classList.contains('read-more')) {
      window.location.href = `singlepost.html?id=${encodeURIComponent(postId)}`;
    }
  });
  
  postCard.style.cursor = 'pointer';
  return postCard;
}

// Funksioni për të trajtuar ndryshimin e tab-ave
function switchTab(tabId) {
  // Përditëson tab-in aktiv
  activeTab = tabId;
  
  // Përditëson butonat e tab-ave
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Përditëson përmbajtjen e tab-it
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(content => {
    if (content.id === tabId) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });
}

// Funksioni për të shfaqur modal-in e editimit të postimit
function showEditPostModal(post) {
  const modal = document.getElementById('editPostModal');
  const closeModal = modal.querySelector('.close-modal');
  const cancelBtn = document.getElementById('cancelEditBtn');
  const saveBtn = document.getElementById('savePostBtn');
  const deleteBtn = document.getElementById('deletePostBtn');
  const titleInput = document.getElementById('postTitle');
  const contentInput = document.getElementById('postContent');
  const postIdInput = document.getElementById('postId');
  
  // Mbush formën me të dhënat e postimit
  titleInput.value = post.title || '';
  contentInput.value = post.content || '';
  postIdInput.value = post.id || post.guid;
  
  // Rivendos mesazhet e gabimit
  const errorElements = modal.querySelectorAll('.error-message');
  errorElements.forEach(el => {
    el.textContent = '';
  });
  
  // Heq klasat e gabimit
  const inputs = modal.querySelectorAll('input, textarea');
  inputs.forEach(input => {
    input.classList.remove('error-input');
  });
  
  // Shfaq modal-in
  modal.style.display = 'block';
  
  // Ngjarjet për mbylljen e modal-it
  closeModal.onclick = () => {
    modal.style.display = 'none';
  };
  
  cancelBtn.onclick = () => {
    modal.style.display = 'none';
  };
  
  // Ngjarje për butonin e fshirjes
  deleteBtn.onclick = () => {
    modal.style.display = 'none';
    showDeleteConfirmation(post.id || post.guid);
  };
  
  // Ngjarje për butonin e ruajtjes
  saveBtn.onclick = () => {
    if (validateForm(document.getElementById('editPostForm'), postValidationRules)) {
      updatePost(postIdInput.value, titleInput.value, contentInput.value);
      modal.style.display = 'none';
    }
  };
  
  // Mbyll nëse klikohet jashtë përmbajtjes së modal-it
  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
}

// Funksioni për të shfaqur modal-in e konfirmimit të fshirjes
function showDeleteConfirmation(postId) {
  const modal = document.getElementById('confirmationModal');
  const closeModal = modal.querySelector('.close-modal');
  const cancelBtn = document.getElementById('cancelDeleteBtn');
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  
  // Shfaq modal-in
  modal.style.display = 'block';
  
  // Ngjarjet për mbylljen e modal-it
  closeModal.onclick = () => {
    modal.style.display = 'none';
  };
  
  cancelBtn.onclick = () => {
    modal.style.display = 'none';
  };
  
  // Ngjarje për konfirmimin e fshirjes
  confirmBtn.onclick = () => {
    deletePost(postId);
    modal.style.display = 'none';
  };
  
  // Mbyll nëse klikohet jashtë modal-it
  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
}

// Funksioni për të përditësuar postimin
async function updatePost(postId, title, content) {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    showNotification("You must be logged in to update a post.", "error");
    return;
  }
  
  try {
    // Merr postimin ekzistues së pari për të ruajtur fushat e tjera
    const getResponse = await fetch(`https://localhost:7059/api/Blog/GetPosts/${postId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!getResponse.ok) {
      throw new Error("Failed to fetch post data");
    }
    
    const existingPost = await getResponse.json();
    console.log("Të dhënat e postimit ekzistues:", existingPost);
    
    // Nxjerr ID-të e kategorive nga postimi ekzistues
    let categoryIds = [];
    if (existingPost.postCategories && existingPost.postCategories.length > 0) {
      categoryIds = existingPost.postCategories.map(pc => pc.categoryGuid || pc.categoryId);
    } else if (existingPost.categoryId) {
      categoryIds = [existingPost.categoryId];
    }
    
    // Përgatit të dhënat e përditësimit
    const updateData = {
      id: postId,
      title: title,
      content: content,
      publishAt: existingPost.publishAt || new Date().toISOString(),
      status: existingPost.status || "Published",
      categories: categoryIds
    };
    
    console.log("Duke dërguar të dhënat e përditësimit:", updateData);
    
    const response = await fetch(`https://localhost:7059/api/Blog/EditPost`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      throw new Error("Failed to update post");
    }
    
    showNotification("Post updated successfully!", "success");
    
    // Rifreskoj profilin e përdoruesit për të marrë postimet e përditësuara
    fetchUserProfile();
  } catch (error) {
    console.error("Gabim në përditësimin e postimit:", error);
    showNotification("Error updating post. Please try again.", "error");
  }
}

// Funksioni për të fshirë postimin
async function deletePost(postId) {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    showNotification("You must be logged in to delete a post.", "error");
    return;
  }
  
  try {
    const response = await fetch(`https://localhost:7059/api/Blog/DeletePost/${postId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) {
      throw new Error("Failed to delete post");
    }
    
    showNotification("Post deleted successfully!", "success");
    
    // Rifreskoj profilin e përdoruesit për të marrë postimet e përditësuara
    fetchUserProfile();
  } catch (error) {
    console.error("Gabim në fshirjen e postimit:", error);
    showNotification("Error deleting post. Please try again.", "error");
  }
}

// Funksioni për të përditësuar profilin
async function updateProfile(formData) {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    showNotification("You must be logged in to update your profile.", "error");
    return;
  }
  
  try {
    const response = await fetch("https://localhost:7059/api/Users/update-my-profile", {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        description: formData.description,
        location: formData.location,
        profileImageUrl: currentUser.profileImageUrl || "", // Sigurohet që ruan foton ekzistuese të profilit
        socialMedia: {
          facebook: formData.facebook || "",
          twitter: formData.twitter || "",
          instagram: formData.instagram || ""
        }
      })
    });
    
    if (!response.ok) {
      throw new Error("Failed to update profile");
    }
    
    showNotification("Profile updated successfully!", "success");
    
    // Rifreskoj profilin e përdoruesit
    fetchUserProfile();
  } catch (error) {
    console.error("Gabim në përditësimin e profilit:", error);
    showNotification("Error updating profile. Please try again.", "error");
  }
}

// Funksioni për të ngarkuar foton e profilit
async function uploadProfileImage(fileData) {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    showNotification("You must be logged in to upload an image.", "error");
    return;
  }
  
  try {
    const formData = new FormData();
    formData.append('image', fileData); // Ndryshuar në 'image' për të përputhur parametrin e backend-it
    
    const response = await fetch("https://localhost:7059/api/Users/upload-profile-image", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error("Failed to upload profile picture");
    }
    
    const result = await response.json();
    showNotification("Profile picture updated successfully!", "success");
    
    // Rifreskoj profilin e përdoruesit
    fetchUserProfile();
  } catch (error) {
    console.error("Gabim në ngarkimin e fotos së profilit:", error);
    showNotification("Error uploading profile picture. Please try again.", "error");
  }
}

// Funksioni për të shfaqur modal-in e ngarkimit të imazhit
function showImageUploadModal() {
  const modal = document.getElementById('imageUploadModal');
  const closeModal = modal.querySelector('.close-modal');
  const cancelBtn = document.getElementById('cancelUploadBtn');
  const confirmBtn = document.getElementById('confirmUploadBtn');
  const fileInput = document.getElementById('imageFile');
  const imagePreview = document.getElementById('imagePreview');
  
  // Rivendos input-in e fajlit
  fileInput.value = '';
  
  // Rivendos foton e preview
  imagePreview.src = currentUser && currentUser.profileImageUrl ? 
    currentUser.profileImageUrl : '/images/default-avatar.jpg';
  
  // Shfaq modal-in
  modal.style.display = 'block';
  
  // Ngjarje për ndryshimin e input-it të fajlit
  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Shfaq preview të imazhit
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Ngjarjet për mbylljen e modal-it
  closeModal.onclick = () => {
    modal.style.display = 'none';
  };
  
  cancelBtn.onclick = () => {
    modal.style.display = 'none';
  };
  
  // Ngjarje për konfirmimin e ngarkimit
  confirmBtn.onclick = () => {
    if (fileInput.files && fileInput.files[0]) {
      uploadProfileImage(fileInput.files[0]);
      modal.style.display = 'none';
    } else {
      showNotification("Please select an image to upload.", "error");
    }
  };
  
  // Mbyll nëse klikohet jashtë modal-it
  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
}

// Shfaq/fsheh indikatorin e ngarkimit
function showLoader(containerId) {
  const container = document.getElementById(containerId) || document.querySelector(`.${containerId}`);
  if (container) {
    // Kontrollon nëse loader-i ekziston tashmë
    if (!document.getElementById(`${containerId}-loader`)) {
      const loader = document.createElement('div');
      loader.className = 'loading';
      loader.id = `${containerId}-loader`;
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

// Funksioni për të shfaqur njoftimin
function showNotification(message, type = 'info') {
  // Kontrollon nëse kontejneri i njoftimeve ekziston, krijon nëse jo
  let notificationContainer = document.getElementById('notification-container');
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    document.body.appendChild(notificationContainer);
  }
  
  // Krijon elementin e njoftimit
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span>${message}</span>
      <button class="close-notification">&times;</button>
    </div>
  `;
  
  // Shton në kontejner
  notificationContainer.appendChild(notification);
  
  // Shton ngjarjen e mbylljes
  const closeBtn = notification.querySelector('.close-notification');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
  }
  
  // Largon automatikisht pas 5 sekondash
  setTimeout(() => {
    if (notification.parentNode) {
      notification.classList.add('fade-out');
      setTimeout(() => {
        if (notification.parentNode) {
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

// Thërret setupLazyLoading kur DOM ngarkohet
window.addEventListener('load', function() {
  setupLazyLoading();
});