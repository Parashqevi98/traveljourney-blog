// Thërret setupMobileMenu përsëri pasi gjithçka është ngarkuar plotësisht
window.addEventListener('load', function() {
  // Pret një moment për të siguruar që gjithçka është renderuar plotësisht
  setTimeout(setupMobileMenu, 100);
});

document.addEventListener("DOMContentLoaded", async () => {
  // Inicializon faqen
  await updateNavbar(); // Përdor async/await për përditësimin e navbar
  
  // Sigurohet që titulli të jetë në anglisht
  document.title = "Share Your Journey - Create Travel Story | TravelJourney";
  
  // Kontrollon nëse përdoruesi është i loguar
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    alert("You are not logged in. Please log in to continue.");
    sessionStorage.setItem("redirectAfterLogin", "create.html");
    window.location.href = "login.html";
    return;
  }
  
  setupMobileMenu();
  loadCategories();
  setupLoginDialog();
  
  // Kontrollon nëse duhet të shfaqë mesazhin e mirëseardhjes ose të trajtojë ridrejtimet
  checkLoginSuccess();
  checkRedirection();

  // Vendos datën e parazgjedhur të publikimit në datën dhe orën aktuale
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById("publishAt").value = now.toISOString().slice(0, 16);

  // Merr elementët e formës
  const form = document.getElementById("createPostForm");
  const categoriesSelect = document.getElementById("categories");
  const imageInput = document.getElementById("image");
  const submitBtn = document.querySelector(".submit-btn");
  const imagePreview = document.getElementById("imagePreview");
  const imageDropArea = document.getElementById("imageDropArea");
  const nextButtons = document.querySelectorAll(".btn-next");
  const prevButtons = document.querySelectorAll(".btn-prev");
  const formSteps = document.querySelectorAll(".form-step");
  const progressSteps = document.querySelectorAll(".progress-step");

  // Konfiguron modelet dhe mesazhet e validimit të formës
  const validationPatterns = {
    title: {
      pattern: /^.{5,100}$/,
      message: "Title must be between 5 and 100 characters"
    },
    content: {
      pattern: /^.{50,}$/s,
      message: "Content must be at least 50 characters"
    },
    categories: {
      message: "Please select at least one category"
    }
  };

  /**
   * Kontrollon nëse token-i JWT është i skaduar
   * @param {string} token - Token JWT për të kontrolluar
   * @returns {boolean} - True nëse token-i është i skaduar, false përndryshe
   */
  function isTokenExpired(token) {
    if (!token || token.split('.').length !== 3) {
      console.error("Token i pavlefshëm:", token);
      return true;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (err) {
      console.error("Gabim në dekodimin e token-it:", err);
      return true;
    }
  }

  /**
   * Rifreskoj token-in e aksesit duke përdorur refresh token
   * @returns {Promise<string|null>} - Token i ri i aksesit ose null nëse rifreskimi dështoi
   */
  async function refreshAccessToken() {
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
      alert("Your session has expired. Please log in again.");
      sessionStorage.setItem("redirectAfterLogin", "create.html");
      window.location.href = "login.html";
      return null;
    }

    try {
      const response = await fetch("https://localhost:7059/api/Users/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        throw new Error("Failed to refresh token.");
      }

      const data = await response.json();
      localStorage.setItem("accessToken", data.accessToken);
      return data.accessToken;
    } catch (err) {
      console.error("Gabim në rifreskimin e token-it:", err);
      alert("Your session has expired. Please log in again.");
      sessionStorage.setItem("redirectAfterLogin", "create.html");
      window.location.href = "login.html";
      return null;
    }
  }

  /**
   * Shfaq mesazhin e gabimit në formë
   * @param {string} message - Mesazhi i gabimit për të shfaqur
   */
  function showError(message) {
    // Heq mesazhet ekzistuese të gabimit
    const existingError = document.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }
    
    // Krijon dhe shfaq mesazhin e ri të gabimit
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // E vendos në krye të hapit aktiv të formës
    const activeStep = document.querySelector('.form-step.active-step');
    if (activeStep) {
      activeStep.insertBefore(errorDiv, activeStep.firstChild);
      
      // Scrollon tek mesazhi i gabimit
      errorDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Aktivizon butonin e dërgimit përsëri
    if (submitBtn) {
      submitBtn.innerHTML = 'Publish My Story <i class="fas fa-paper-plane"></i>';
      submitBtn.disabled = false;
    }
  }

  /**
   * Shfaq mesazhin e suksesit në formë
   * @param {string} message - Mesazhi i suksesit për të shfaqur
   */
  function showSuccess(message) {
    // Heq mesazhet ekzistuese
    const existingMessage = document.querySelector('.error-message, .success-message');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    // Krijon dhe shfaq mesazhin e suksesit
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    // E vendos në krye të hapit aktiv të formës
    const activeStep = document.querySelector('.form-step.active-step');
    if (activeStep) {
      activeStep.insertBefore(successDiv, activeStep.firstChild);
      
      // Shton animacionin e suksesit
      successDiv.classList.add('success-pulse');
      
      // Scrollon tek mesazhi i suksesit
      successDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Shfaq gabimin e validimit të input-it
   * @param {HTMLElement} input - Elementi input që ka gabim
   * @param {string} message - Mesazhi i gabimit për të shfaqur
   */
  function showInputError(input, message) {
    // Gjen elementin e ndihmës së gabimit
    const errorHint = input.closest('.form-group').querySelector('.error-hint');
    
    // Shfaq mesazhin e gabimit
    if (errorHint) {
      errorHint.textContent = message;
      errorHint.style.display = 'block';
    }
    
    // Shton animacionin e dridhjes
    input.classList.add('shake');
    
    // Heq klasën e dridhjes pas përfundimit të animacionit
    setTimeout(() => {
      input.classList.remove('shake');
    }, 500);
  }

  /**
   * Fsheh gabimin e validimit të input-it
   * @param {HTMLElement} input - Elementi input për të fshehur gabimin
   */
  function hideInputError(input) {
    const errorHint = input.closest('.form-group').querySelector('.error-hint');
    if (errorHint) {
      errorHint.style.display = 'none';
    }
  }

  /**
   * Validizon input-in e formës bazuar në model
   * @param {HTMLElement} input - Elementi input për të validuar
   * @returns {boolean} - True nëse është i vlefshëm, false përndryshe
   */
  function validateInput(input) {
    const fieldName = input.id;
    const value = input.value.trim();
    
    // Kalon validimin nëse input-i nuk ka model validimi
    if (!validationPatterns[fieldName]) {
      return true;
    }
    
    // Për kategoritë, kontrollon nëse të paktën një është e zgjedhur
    if (fieldName === 'categories') {
      const selected = Array.from(input.selectedOptions).length > 0;
      if (!selected) {
        showInputError(input, validationPatterns[fieldName].message);
        return false;
      }
      return true;
    }
    
    // Për fushat e tjera, kontrollon kundrejt modelit regex
    const pattern = validationPatterns[fieldName].pattern;
    if (!pattern.test(value)) {
      showInputError(input, validationPatterns[fieldName].message);
      return false;
    }
    
    return true;
  }

  /**
   * Inicializon faqen - merr kategoritë dhe konfiguron dërgimin e formës
   */
  async function initialize() {
    let token = localStorage.getItem("accessToken");

    if (isTokenExpired(token)) {
      token = await refreshAccessToken();
      if (!token) return;
    }

    // Merr kategoritë
    try {
      const res = await fetch("https://localhost:7059/api/Blog/GetAllCategories", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error("Error fetching categories");
      }
      
      const data = await res.json();
      
      // Mbush dropdown-in e kategorive
      if (categoriesSelect) {
        data.forEach(category => {
          const option = document.createElement("option");
          option.value = category.id;
          option.textContent = category.name;
          categoriesSelect.appendChild(option);
        });
      }
    } catch (err) {
      console.error("Gabim në marrjen e kategorive:", err);
      showError("Could not load categories. Please try again later.");
    }

    // Konfiguron navigimin e formës shumë-hapa
    setupFormNavigation();
    
    // Konfiguron trajtimin e ngarkimit të imazhit
    setupImageUpload();
    
    // Konfiguron numëruesin e karaktereve për përmbajtjen
    setupContentCounter();
    
    // Konfiguron validimin e input-it
    setupInputValidation();
    
    // Konfiguron dërgimin e formës
    setupFormSubmission();
  }
  
  /**
   * Konfiguron navigimin e formës shumë-hapa
   */
  function setupFormNavigation() {
    // Handler për klikimin e butonit "Tjetër"
    nextButtons.forEach(button => {
      button.addEventListener('click', () => {
        const currentStep = document.querySelector('.form-step.active-step');
        const currentStepNumber = parseInt(currentStep.id.replace('step', ''));
        const targetStepNumber = parseInt(button.dataset.step);
        
        // Validizon hapin aktual para se të vazhdojë
        if (!validateStep(currentStepNumber)) {
          return;
        }
        
        // Përditëson hapat e progresit
        updateProgressSteps(targetStepNumber);
        
        // Kalon në hapin tjetër
        currentStep.classList.remove('active-step');
        document.getElementById(`step${targetStepNumber}`).classList.add('active-step');
        
        // Nëse kalon në hapin e rishikimit, përditëson përmbajtjen e rishikimit
        if (targetStepNumber === 3) {
          updateReviewContent();
        }
        
        // Scrollon në krye të formës
        document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
      });
    });
    
    // Handler për klikimin e butonit "Mbrapa"
    prevButtons.forEach(button => {
      button.addEventListener('click', () => {
        const currentStep = document.querySelector('.form-step.active-step');
        const targetStepNumber = parseInt(button.dataset.step);
        
        // Përditëson hapat e progresit
        updateProgressSteps(targetStepNumber);
        
        // Kalon në hapin e mëparshëm
        currentStep.classList.remove('active-step');
        document.getElementById(`step${targetStepNumber}`).classList.add('active-step');
        
        // Scrollon në krye të formës
        document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }
  
  /**
   * Përditëson treguesit e hapave të progresit
   * @param {number} currentStep - Numri i hapit aktual
   */
  function updateProgressSteps(currentStep) {
    progressSteps.forEach((step, index) => {
      // Numrat e hapave janë 1-bazë, index është 0-bazë
      const stepNumber = index + 1;
      
      if (stepNumber < currentStep) {
        step.classList.add('completed');
        step.classList.remove('active');
      } else if (stepNumber === currentStep) {
        step.classList.add('active');
        step.classList.remove('completed');
      } else {
        step.classList.remove('active', 'completed');
      }
    });
  }
  
  /**
   * Validizon hapin aktual para se të vazhdojë
   * @param {number} stepNumber - Numri i hapit aktual
   * @returns {boolean} - True nëse është i vlefshëm, false përndryshe
   */
  function validateStep(stepNumber) {
    let isValid = true;
    
    if (stepNumber === 1) {
      // Validizon titullin
      const titleInput = document.getElementById('title');
      if (titleInput && !validateInput(titleInput)) {
        isValid = false;
      }
      
      // Validizon kategoritë
      const categoriesInput = document.getElementById('categories');
      if (categoriesInput && Array.from(categoriesInput.selectedOptions).length === 0) {
        showInputError(categoriesInput, validationPatterns.categories.message);
        isValid = false;
      }
    } else if (stepNumber === 2) {
      // Validizon përmbajtjen
      const contentInput = document.getElementById('content');
      if (contentInput && !validateInput(contentInput)) {
        isValid = false;
      }
    }
    
    return isValid;
  }
  
  /**
   * Konfiguron trajtimin e ngarkimit të imazhit
   */
  function setupImageUpload() {
    // Sigurohet që kontejneri i preview të imazhit ekziston
    if (!imagePreview || !imageDropArea) {
      console.error("Kontejneri i preview të imazhit ose zona e zvarritjes nuk u gjet");
      return;
    }
    
    // Konfiguron funksionalitetin drag and drop
    imageDropArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      imageDropArea.classList.add('drag-over');
    });
    
    imageDropArea.addEventListener('dragleave', () => {
      imageDropArea.classList.remove('drag-over');
    });
    
    imageDropArea.addEventListener('drop', (e) => {
      e.preventDefault();
      imageDropArea.classList.remove('drag-over');
      
      if (e.dataTransfer.files.length) {
        imageInput.files = e.dataTransfer.files;
        handleImageSelected();
      }
    });
    
    // Klikimi në zonën e zvarritjes aktivizon input-in e fajlit
    imageDropArea.addEventListener('click', () => {
      imageInput.click();
    });
    
    // Trajton zgjedhjen e fajlit
    imageInput.addEventListener('change', handleImageSelected);
    
    // Trajton butonin e heqjes së imazhit
    const removeButton = document.querySelector('.remove-image-btn');
    if (removeButton) {
      removeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        imageInput.value = '';
        imagePreview.style.display = 'none';
        imageDropArea.style.display = 'block';
      });
    }
  }
  
  /**
   * Trajton zgjedhjen e fajlit të imazhit
   */
  function handleImageSelected() {
    if (imageInput.files && imageInput.files[0]) {
      const file = imageInput.files[0];
      
      // Validizon tipin e fajlit
      const fileType = file.type;
      if (!fileType.match('image.*')) {
        showError('Please select an image file (JPG, PNG, GIF).');
        return;
      }
      
      // Validizon madhësinë e fajlit (maksimum 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('Image size cannot exceed 5MB.');
        return;
      }
      
      // Shfaq preview të imazhit
      const reader = new FileReader();
      reader.onload = (e) => {
        // Kontrollon nëse elementi i preview ekziston
        let previewImg = document.querySelector('.image-preview-img');
        
        if (!previewImg) {
          // Nëse nuk ekziston, e krijon
          console.log("Krijon elementin e preview të imazhit...");
          previewImg = document.createElement('img');
          previewImg.className = 'image-preview-img';
          previewImg.style.cssText = `
            width: 100%;
            height: 200px;
            object-fit: cover;
            border-radius: 8px;
            border: 2px solid #e0e0e0;
          `;
          
          // E shton në kontejnerin e preview
          if (imagePreview) {
            // Pastron përmbajtjen ekzistuese dhe shton imazhin
            imagePreview.innerHTML = '';
            imagePreview.appendChild(previewImg);
            
            // Shton butonin e heqjes
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-image-btn';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.style.cssText = `
              position: absolute;
              top: 10px;
              right: 10px;
              background: rgba(255, 255, 255, 0.9);
              border: none;
              border-radius: 50%;
              width: 30px;
              height: 30px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              color: #666;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            `;
            
            removeBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              imageInput.value = '';
              imagePreview.style.display = 'none';
              imageDropArea.style.display = 'block';
            });
            
            imagePreview.appendChild(removeBtn);
            imagePreview.style.position = 'relative';
          }
        }
        
        if (previewImg) {
          previewImg.src = e.target.result;
          imagePreview.style.display = 'block';
          imageDropArea.style.display = 'none';
          console.log("Preview i imazhit u vendos me sukses");
        } else {
          console.error("Nuk mund të krijohet elementi i preview të imazhit");
        }
      };
      reader.readAsDataURL(file);
    }
  }
  
  /**
   * Konfiguron numëruesin e karaktereve të përmbajtjes
   */
  function setupContentCounter() {
    const contentTextarea = document.getElementById('content');
    const characterCount = document.querySelector('.character-count');
    
    if (!contentTextarea || !characterCount) {
      console.error("Textarea e përmbajtjes ose elementi i numërimit të karaktereve nuk u gjet");
      return;
    }
    
    function updateCharacterCount() {
      const count = contentTextarea.value.length;
      characterCount.textContent = `${count} characters`;
      
      // Ndryshon ngjyrën bazuar në numërimin
      if (count < 50) {
        characterCount.style.color = '#e53935';
      } else if (count < 100) {
        characterCount.style.color = '#ff9800';
      } else {
        characterCount.style.color = '#4caf50';
      }
    }
    
    contentTextarea.addEventListener('input', updateCharacterCount);
    updateCharacterCount(); // Inicializon numërimin
  }
  
  /**
   * Konfiguron validimin e input-it në blur dhe input
   */
  function setupInputValidation() {
    // Shton validim në blur
    const titleInput = document.getElementById('title');
    const contentInput = document.getElementById('content');
    
    if (titleInput) {
      titleInput.addEventListener('blur', (e) => {
        validateInput(e.target);
      });
      
      titleInput.addEventListener('input', (e) => {
        hideInputError(e.target);
      });
    }
    
    if (contentInput) {
      contentInput.addEventListener('blur', (e) => {
        validateInput(e.target);
      });
      
      contentInput.addEventListener('input', (e) => {
        hideInputError(e.target);
      });
    }
    
    if (categoriesSelect) {
      categoriesSelect.addEventListener('change', (e) => {
        hideInputError(e.target);
      });
    }
  }
  
  /**
   * Përditëson përmbajtjen e rishikimit në hapin e tretë
   */
  function updateReviewContent() {
    const reviewTitle = document.getElementById('reviewTitle');
    const reviewCategories = document.getElementById('reviewCategories');
    const reviewContent = document.getElementById('reviewContent');
    const reviewImage = document.getElementById('reviewImage');
    
    if (!reviewTitle || !reviewCategories || !reviewContent || !reviewImage) {
      console.error("Elementët e rishikimit nuk u gjetën");
      return;
    }
    
    // Përditëson titullin
    reviewTitle.textContent = document.getElementById('title').value;
    
    // Përditëson kategoritë
    const selectedCategories = Array.from(categoriesSelect.selectedOptions)
      .map(option => option.textContent)
      .join(', ');
    reviewCategories.textContent = selectedCategories;
    
    // Përditëson preview të përmbajtjes
    const contentPreview = document.getElementById('content').value.substring(0, 200) + 
      (document.getElementById('content').value.length > 200 ? '...' : '');
    reviewContent.textContent = contentPreview;
    
    // Përditëson preview të imazhit
    const hasImage = imageInput.files && imageInput.files[0];
    if (hasImage) {
      reviewImage.innerHTML = '';
      
      const imgElement = document.createElement('img');
      
      // Kontrollon nëse ekziston preview i mëparshëm
      const existingPreviewImg = document.querySelector('.image-preview-img');
      if (existingPreviewImg && existingPreviewImg.src) {
        imgElement.src = existingPreviewImg.src;
      } else {
        // Nëse nuk ka preview të mëparshëm, e krijon prej fajlit
        const reader = new FileReader();
        reader.onload = (e) => {
          imgElement.src = e.target.result;
        };
        reader.readAsDataURL(imageInput.files[0]);
      }
      
      imgElement.alt = 'Preview';
      imgElement.style.maxWidth = '100%';
      imgElement.style.maxHeight = '200px';
      imgElement.style.objectFit = 'cover';
      imgElement.style.borderRadius = '4px';
      
      reviewImage.appendChild(imgElement);
    } else {
      reviewImage.innerHTML = '<span class="no-image-text">No image uploaded</span>';
    }
  }
  
  /**
   * Konfiguron dërgimin e formës
   */
  function setupFormSubmission() {
    if (!form) {
      console.error("Forma e krijimit të postimit nuk u gjet");
      return;
    }
    
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      // Validimi përfundimtar i të gjitha fushave
      if (!validateAllFields()) {
        return;
      }
      
      // Çaktivizon butonin e dërgimit dhe shfaq gjendjen e ngarkimit
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Publishing...';

      // Kontrollon nëse token-i është ende i vlefshëm
      let postToken = localStorage.getItem("accessToken");
      if (isTokenExpired(postToken)) {
        postToken = await refreshAccessToken();
        if (!postToken) return;
      }

      // Trajton ngarkimin e imazhit së pari nëse imazhi ekziston
      let processedImageUrl = null;
      const imageFile = imageInput.files[0];
      
      if (imageFile) {
        try {
          console.log("Duke ngarkuar imazhin...");
          const imageFormData = new FormData();
          imageFormData.append("image", imageFile);
          
          // Log përmbajtjen e FormData për debugging
          for (let [key, value] of imageFormData.entries()) {
            console.log(`${key}: ${value instanceof File ? value.name : value}`);
          }
          
          const imageResponse = await fetch("https://localhost:7059/api/Blog/upload-image", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${postToken}`
              // VENDORE: Mos vendos Content-Type për FormData - shfletuesi e vendos automatikisht
            },
            body: imageFormData
          });
          
          console.log("Statusi i përgjigjes së ngarkimit të imazhit:", imageResponse.status);
          
          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            console.log("Të dhënat e përgjigjes së ngarkimit të imazhit:", imageData);
            
            // Formatohet URL e imazhit
            let rawImageUrl = imageData.imageUrl;
            processedImageUrl = formatImageUrl(rawImageUrl);
            
            console.log("URL e papërpunuar e imazhit:", rawImageUrl);
            console.log("URL e përpunuar e imazhit:", processedImageUrl);
          } else {
            const errorText = await imageResponse.text();
            console.error("Dështoi në ngarkimin e imazhit:", errorText);
            showError("Error uploading image. Please try again.");
            return;
          }
        } catch (err) {
          console.error("Gabim në ngarkimin e imazhit:", err);
          showError("Error uploading image. Please check your internet connection.");
          return;
        }
      }
      
      // Krijon objektin e të dhënave të postimit
      const postData = {
        title: document.getElementById("title").value,
        content: document.getElementById("content").value,
        publishAt: new Date(document.getElementById("publishAt").value).toISOString(),
        status: parseInt(document.getElementById("status").value),
        imageUrl: processedImageUrl,
        categories: Array.from(categoriesSelect.selectedOptions).map(opt => opt.value)
      };
      
      console.log("Duke dërguar të dhënat e postimit:", postData);

      // Dërgon të dhënat e postimit
      try {
        const response = await fetch("https://localhost:7059/api/Blog/AddBlogPost", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${postToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(postData)
        });
        
        console.log("Statusi i përgjigjes së dërgimit të postimit:", response.status);

        if (response.ok) {
          // Shfaq animacionin e suksesit
          submitBtn.innerHTML = '<i class="fas fa-check"></i> Post Created!';
          submitBtn.style.backgroundColor = '#4caf50';
          
          showSuccess("Post created successfully! Redirecting to posts list...");
          
          // Ridrejton pas një kohe të shkurtër
          setTimeout(() => {
            window.location.href = "posts.html";
          }, 2000);
        } else if (response.status === 401) {
          alert("Authentication failed. Please log in again.");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          sessionStorage.setItem("redirectAfterLogin", "create.html");
          window.location.href = "login.html";
        } else {
          const errorText = await response.text();
          console.error("Përgjigja e gabimit:", errorText);
          showError("Failed to create post. Please try again.");
        }
      } catch (err) {
        console.error("Gabim në dërgimin e kërkesës:", err);
        showError("Error sending request. Please check your internet connection.");
      }
    });
  }
  
  /**
   * Formatohet URL-ja e imazhit për të siguruar që është e duhur
   * @param {string} imageUrl - URL e papërpunuar e imazhit
   * @returns {string|null} - URL e formatuar ose null
   */
  function formatImageUrl(imageUrl) {
    if (!imageUrl) return null;
    
    // Nëse është URL e plotë (http/https), kthehu ashtu siç është
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // Heq slash-in e parë nëse ekziston
    if (imageUrl.startsWith('/')) {
      imageUrl = imageUrl.substring(1);
    }
    
    // Heq prefixin wwwroot/ nëse ekziston
    if (imageUrl.startsWith('wwwroot/')) {
      imageUrl = imageUrl.substring(8);
    }
    
    // Ndërton URL-në e plotë me base URL e serverit
    return `https://localhost:7059/${imageUrl}`;
  }
  
  /**
   * Validizon të gjitha fushat e formës
   * @returns {boolean} - True nëse të gjitha fushat janë të vlefshme, false përndryshe
   */
  function validateAllFields() {
    let isValid = true;
    
    // Validizon titullin
    const titleInput = document.getElementById('title');
    if (titleInput && !validateInput(titleInput)) {
      isValid = false;
    }
    
    // Validizon përmbajtjen
    const contentInput = document.getElementById('content');
    if (contentInput && !validateInput(contentInput)) {
      isValid = false;
    }
    
    // Validizon kategoritë
    if (categoriesSelect && Array.from(categoriesSelect.selectedOptions).length === 0) {
      showInputError(categoriesSelect, validationPatterns.categories.message);
      isValid = false;
    }
    
    return isValid;
  }

  // Fillon inicializimin
  initialize();
});

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

// Funksioni për të ngarkuar kategoritë për dropdown-in e header-it
function loadCategories() {
  const categoryList = document.getElementById("categoryList");
  
  if (categoryList) {
    fetch("https://localhost:7059/api/Blog/GetAllCategories")
      .then(response => response.json())
      .then(categories => {
        // Pastron kategoritë ekzistuese së pari
        categoryList.innerHTML = '';
        
        // Shton kategoritë në dropdown
        categories.forEach(category => {
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.href = `posts.html?category=${category.id}`;
          a.textContent = category.name;
          li.appendChild(a);
          categoryList.appendChild(li);
        });
      })
      .catch(error => {
        console.error("Gabim në ngarkimin e kategorive për dropdown:", error);
      });
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

/**
 * Funksioni për të shfaqur njoftimet
 * @param {string} message - Mesazhi për të shfaqur në njoftim
 * @param {string} type - Tipi i njoftimit (success, error, info)
 */
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

/**
 * Konfiguron funksionalitetin e ndryshuesit të menusë mobile
 * Ky funksion trajton butonin e ndryshuesit të menusë mobile
 */
function setupMobileMenu() {
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileMenuToggle && navLinks) {
    // Ndryshon menunë mobile
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