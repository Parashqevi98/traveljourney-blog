document.addEventListener('DOMContentLoaded', async () => {
  // Elementët e DOM
  const categoryList = document.getElementById('categoryList');
  const categoryTitle = document.getElementById('categoryTitle');
  const categoryPosts = document.getElementById('categoryPosts');
  const featuredCategoryPosts = document.getElementById('featuredCategoryPosts');
  const categoryHighlight = document.getElementById('categoryHighlight');
  const viewOptions = document.querySelectorAll('.view-option');

  // Përditëson navbar për çdo faqe - përdor async/await për përditësimin e navbar
  if (typeof updateNavbar === 'function') {
    await updateNavbar();
  }
  
  // Ndreqje e drejtpërdrejtë për problemin e ndryshuesit të menusë mobile
  setTimeout(function() {
    console.log("Po fillon skripti i ndreqjes së menusë mobile");
    
    // Merr butonin e ndryshuesit të menusë mobile
    var mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    var navLinks = document.querySelector('.nav-links');
    
    console.log("Elementi i ndryshuesit të menusë mobile:", mobileMenuToggle);
    console.log("Elementi i lidhjeve të navigimit:", navLinks);
    
    if (mobileMenuToggle && navLinks) {
      // Heq të gjithë click listeners ekzistues për të shmangur konfliktet
      var newMobileMenuToggle = mobileMenuToggle.cloneNode(true);
      mobileMenuToggle.parentNode.replaceChild(newMobileMenuToggle, mobileMenuToggle);
      mobileMenuToggle = newMobileMenuToggle;
      
      // Shton një click listener të thjeshtë
      mobileMenuToggle.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        console.log("Ndryshuesit i menusë mobile u klikua!");
        
        // Ndryshon klasën active në nav links
        if (navLinks.classList.contains('active')) {
          navLinks.classList.remove('active');
          console.log("Menuja mobile u mbyll");
        } else {
          navLinks.classList.add('active');
          console.log("Menuja mobile u hap");
        }
      });
      
      console.log("Click listener-i i menusë mobile u shtua me sukses");
    } else {
      console.error("Nuk mund të gjej elementët e menusë mobile");
    }
    
    // Konfiguron ndryshuesit e dropdown për mobile
    var dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(function(dropdown) {
      var dropdownLink = dropdown.querySelector('a');
      if (dropdownLink) {
        var newDropdownLink = dropdownLink.cloneNode(true);
        dropdownLink.parentNode.replaceChild(newDropdownLink, dropdownLink);
        
        newDropdownLink.addEventListener('click', function(event) {
          if (window.innerWidth <= 768) {
            event.preventDefault();
            dropdown.classList.toggle('active');
            console.log("Dropdown u ndryshua");
          }
        });
      }
    });
  }, 500); // Pret 500ms për të gjithë elementët të ngarkohen plotësisht
  
  // Kontrollon nëse duhet të shfaqë mesazhin e mirëseardhjes ose të trajtojë ridrejtimet
  checkLoginSuccess();
  checkRedirection();

  // Event listeners për opsionet e pamjes
  viewOptions.forEach(option => {
    option.addEventListener('click', () => {
      // Heq klasën active nga të gjitha opsionet
      viewOptions.forEach(btn => btn.classList.remove('active'));
      
      // Shton klasën active tek opsioni i klikuar
      option.classList.add('active');
      
      // Merr tipin e pamjes
      const viewType = option.getAttribute('data-view');
      
      // Përditëson pamjen
      if (categoryPosts) {
        categoryPosts.className = viewType + '-view';
      }
    });
  });

  // Funksioni për të marrë parametrat e URL
  function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  // Funksioni për të ngarkuar kategoritë nga API
  function loadCategories() {
    fetch('https://localhost:7059/api/Blog/GetAllCategories')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        return response.json();
      })
      .then(categories => {
        if (categoryList) {
          categoryList.innerHTML = ''; // Pastron listën para se të mbushë
          categories.forEach(category => {
            const categoryItem = document.createElement('li');
            // Formaton URL-në e duhur për lidhjet e kategorive
            categoryItem.innerHTML = `<a href="categories.html?id=${category.id}&name=${encodeURIComponent(category.name)}">${category.name}</a>`;
            categoryList.appendChild(categoryItem);
          });

          // Kontrollon nëse duhet të ngarkojë postime për një kategori specifike (nga parametrat e URL)
          const categoryId = getUrlParameter('id');
          const categoryName = getUrlParameter('name');

          if (categoryId && categoryName) {
            loadCategoryPosts(categoryId, decodeURIComponent(categoryName));
          }
        }
      })
      .catch(error => {
        console.error('Gabim në marrjen e kategorive:', error);
        if (categoryPosts) {
          categoryPosts.innerHTML = '<div class="error-message">Failed to load categories. Please try again later.</div>';
        }
        showNotification('Failed to load categories. Please try again later.', 'error');
      });
  }

  // Funksioni për të ngarkuar postimet për një kategori specifike
  function loadCategoryPosts(categoryId, categoryName) {
    if (!categoryTitle) return;

    // Përditëson titullin e kategorisë dhe theksimin
    categoryTitle.textContent = categoryName;
    if (categoryHighlight) {
      categoryHighlight.textContent = categoryName;
    }

    fetch(`https://localhost:7059/api/Blog/GetPostsByCategory/${categoryId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch posts for category');
        }
        return response.json();
      })
      .then(posts => {
        console.log("Postimet e kategorisë u morën:", posts);
        
        // Për çdo postim, merr informacionin e autorit nëse userId është i disponueshëm
        const postsWithAuthors = posts.map(post => {
          if (post.userId) {
            return fetchAuthorInfo(post);
          } else {
            return Promise.resolve(post);
          }
        });
        
        // Pret që të gjitha informacionet e autorit të merren
        return Promise.all(postsWithAuthors);
      })
      .then(postsWithAuthorInfo => {
        if (postsWithAuthorInfo.length > 0) {
          // Trajton postimet e veçanta (dy të parat)
          if (featuredCategoryPosts && postsWithAuthorInfo.length >= 1) {
            featuredCategoryPosts.innerHTML = '';
            
            // Krijon grid-in e postimeve të veçanta
            const featuredGrid = document.createElement('div');
            featuredGrid.className = 'featured-posts-grid';
            
            // Merr numrin e postimeve të veçanta (ose 2 ose të gjitha nëse janë më pak se 2)
            const featuredCount = Math.min(2, postsWithAuthorInfo.length);
            
            // Kalon nëpër postimet e veçanta
            for (let i = 0; i < featuredCount; i++) {
              const post = postsWithAuthorInfo[i];
              featuredGrid.appendChild(createFeaturedPostElement(post, categoryName));
            }
            
            featuredCategoryPosts.appendChild(featuredGrid);
          }
          
          // Trajton postimet e mbetura
          if (categoryPosts) {
            categoryPosts.innerHTML = '';
            
            // Merr postimet e mbetura (kalon postimet e veçanta)
            const remainingPosts = postsWithAuthorInfo.slice(Math.min(2, postsWithAuthorInfo.length));
            
            if (remainingPosts.length > 0) {
              remainingPosts.forEach(post => {
                categoryPosts.appendChild(createPostElement(post, categoryName));
              });
            } else if (postsWithAuthorInfo.length <= 2) {
              // Nëse kemi vetëm postime të veçanta
              const noMorePosts = document.createElement('div');
              noMorePosts.className = 'info-message';
              noMorePosts.innerHTML = '<p>No additional posts in this category.</p>';
              categoryPosts.appendChild(noMorePosts);
            }
          }
        } else {
          // Nuk u gjetën postime
          if (featuredCategoryPosts) {
            featuredCategoryPosts.innerHTML = '';
          }
          
          if (categoryPosts) {
            categoryPosts.innerHTML = '<div class="info-message"><p>No posts found for this category.</p></div>';
          }
        }
      })
      .catch(error => {
        console.error('Gabim në marrjen e postimeve:', error);
        
        if (featuredCategoryPosts) {
          featuredCategoryPosts.innerHTML = '';
        }
        
        if (categoryPosts) {
          categoryPosts.innerHTML = '<div class="error-message">Failed to load posts. Please try again later.</div>';
        }
        
        showNotification('Failed to load posts for this category.', 'error');
      });
  }

  // Funksioni për të marrë informacionin e autorit
  async function fetchAuthorInfo(post) {
    try {
      const response = await fetch(`https://localhost:7059/api/Users/author-profile/${post.userId}`);
      if (response.ok) {
        const authorData = await response.json();
        // Shton të dhënat e autorit në postim
        post.author = authorData;
      }
      return post;
    } catch (error) {
      console.error(`Gabim në marrjen e të dhënave të autorit për postimin ${post.guid || post.id}:`, error);
      return post; // Kthen postimin origjinal nëse marrja e autorit dështon
    }
  }

  // Funksioni për të krijuar një element postimi të veçantë
  function createFeaturedPostElement(post, categoryName) {
    const postId = post.guid || post.id || '';
    
    // Formaton datën
    const postDate = new Date(post.createdDate || post.publishAt || post.createdAt || new Date());
    const formattedDate = postDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    // Nxjerr një pjesë nga përmbajtja
    const excerpt = post.content ? post.content.substring(0, 150) + '...' : 'No content available';
    
    // Merr informacionin e autorit
    const authorName = getAuthorName(post);
    const authorId = getAuthorId(post);
    const authorHtml = authorId ? 
      `<span class="post-author"><i class="fas fa-user"></i> <a href="author.html?id=${authorId}" class="author-link">${authorName}</a></span>` : 
      `<span class="post-author"><i class="fas fa-user"></i> ${authorName}</span>`;
    
    const featuredPost = document.createElement('div');
    featuredPost.className = 'featured-post';
    
    featuredPost.innerHTML = `
      <div class="featured-post-image">
        ${post.imageUrl ? `<img src="${post.imageUrl}" alt="${post.title}" />` : '<img src="../images/placeholder.jpg" alt="Placeholder image" />'}
      </div>
      <div class="featured-post-content">
        <div class="post-meta">
          <span class="post-date"><i class="far fa-calendar-alt"></i> ${formattedDate}</span>
          <span class="post-category-tag">${categoryName}</span>
        </div>
        <h2>${post.title}</h2>
        <div class="post-author-container">
          ${authorHtml}
        </div>
        <p>${excerpt}</p>
        <a href="singlepost.html?id=${encodeURIComponent(postId)}" class="read-more-btn">Read More <i class="fas fa-arrow-right"></i></a>
      </div>
    `;
    
    // E bën postimin të klikueshëm përveç lidhjeve të autorit dhe butonit "lexo më shumë"
    featuredPost.addEventListener('click', (e) => {
      const isAuthorLink = e.target.classList.contains('author-link') || 
                         e.target.closest('.author-link');
      const isReadMoreBtn = e.target.classList.contains('read-more-btn') || 
                           e.target.closest('.read-more-btn');
      
      if (!isAuthorLink && !isReadMoreBtn) {
        window.location.href = `singlepost.html?id=${encodeURIComponent(postId)}`;
      }
    });
    
    featuredPost.style.cursor = 'pointer';
    return featuredPost;
  }

  // Funksioni për të krijuar një element postimi
  function createPostElement(post, categoryName) {
    const postId = post.guid || post.id || '';
    
    // Formaton datën
    const postDate = new Date(post.createdDate || post.publishAt || post.createdAt || new Date());
    const formattedDate = postDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    // Nxjerr një pjesë nga përmbajtja
    const excerpt = post.content ? post.content.substring(0, 100) + '...' : 'No content available';
    
    // Merr informacionin e autorit
    const authorName = getAuthorName(post);
    const authorId = getAuthorId(post);
    const authorHtml = authorId ? 
      `<span class="post-author"><i class="fas fa-user"></i> <a href="author.html?id=${authorId}" class="author-link">${authorName}</a></span>` : 
      `<span class="post-author"><i class="fas fa-user"></i> ${authorName}</span>`;
    
    const postItem = document.createElement('div');
    postItem.className = 'post-item';
    
    postItem.innerHTML = `
      <div class="post-item-image">
        ${post.imageUrl ? `<img src="${post.imageUrl}" alt="${post.title}" />` : '<img src="../images/placeholder.jpg" alt="Placeholder image" />'}
      </div>
      <div class="post-item-content">
        <div class="post-meta">
          <span class="post-date"><i class="far fa-calendar-alt"></i> ${formattedDate}</span>
          <span class="post-category-tag">${categoryName}</span>
        </div>
        <h3>${post.title}</h3>
        <div class="post-author-container">
          ${authorHtml}
        </div>
        <p>${excerpt}</p>
        <a href="singlepost.html?id=${encodeURIComponent(postId)}" class="read-more-btn">Read More <i class="fas fa-arrow-right"></i></a>
      </div>
    `;
    
    // E bën postimin të klikueshëm përveç lidhjeve të autorit dhe butonit "lexo më shumë"
    postItem.addEventListener('click', (e) => {
      const isAuthorLink = e.target.classList.contains('author-link') || 
                         e.target.closest('.author-link');
      const isReadMoreBtn = e.target.classList.contains('read-more-btn') || 
                           e.target.closest('.read-more-btn');
      
      if (!isAuthorLink && !isReadMoreBtn) {
        window.location.href = `singlepost.html?id=${encodeURIComponent(postId)}`;
      }
    });
    
    postItem.style.cursor = 'pointer';
    return postItem;
  }

  // Funksion ndihmues për të marrë emrin e autorit nga postimi
  function getAuthorName(post) {
    // Kontrollon nëse kemi të dhëna autori nga thirrja jonë e API
    if (post.author) {
      if (post.author.firstName && post.author.lastName) {
        return `${post.author.firstName} ${post.author.lastName}`.trim();
      }
      if (post.author.firstName) {
        return post.author.firstName;
      }
      if (post.author.lastName) {
        return post.author.lastName;
      }
      if (post.author.email) {
        return post.author.email.split('@')[0]; // Përdor pjesën e username të email-it
      }
    }
    
    // Alternativa nëse të dhënat e autorit nuk janë të disponueshme
    if (post.authorName) {
      return post.authorName;
    }
    
    if (post.authorFirstName || post.authorLastName) {
      return `${post.authorFirstName || ''} ${post.authorLastName || ''}`.trim();
    }
    
    if (post.userName) {
      return post.userName;
    }
    
    if (post.email) {
      return post.email.split('@')[0]; // Përdor pjesën e username të email-it
    }
    
    // Nëse nuk gjendet informacion autori, përdor userId nëse është i disponueshëm dhe trego që është një ID përdoruesi
    if (post.userId) {
      return `User`;
    }
    
    return 'Author';
  }

  // Funksion ndihmues për të marrë ID e autorit
  function getAuthorId(post) {
    if (post.author && post.author.id) {
      return post.author.id;
    }
    
    if (post.authorId) {
      return post.authorId;
    }
    
    if (post.userId) {
      return post.userId;
    }
    
    return null;
  }

  // Ndryshon menunë mobile - Funksioni origjinal mbajtur për përputhshmëri por nuk përdoret
  function setupMobileMenu() {
    console.log("setupMobileMenu origjinal u thirr por nuk përdoret");
    // Funksionaliteti është zëvendësuar nga ndreqja e drejtpërdrejtë më sipër
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

  // Ngarkon kategoritë kur faqja ngarkohet
  loadCategories();
});