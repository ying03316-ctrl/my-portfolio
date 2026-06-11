/**
 * Portfolio App - Main JavaScript
 * 苹果风格作品集网站
 */

// ============================================
// Data Loading
// ============================================

async function loadData(filename) {
  try {
    const response = await fetch(`data/${filename}`);
    if (!response.ok) throw new Error(`Failed to load ${filename}`);
    return await response.json();
  } catch (error) {
    console.error('Error loading data:', error);
    return null;
  }
}

// ============================================
// Profile Section
// ============================================

function renderProfile(profile) {
  if (!profile) return;

  // Update page title
  document.title = `${profile.name} - Portfolio`;

  // Header logo
  document.getElementById('headerLogo').textContent = profile.name;

  // Hero section
  document.getElementById('heroAvatar').src = profile.avatar;
  document.getElementById('heroAvatar').alt = profile.name;
  document.getElementById('heroName').textContent = profile.name;
  document.getElementById('heroTitle').textContent = profile.title;
  document.getElementById('heroBio').textContent = profile.bio;

  // Social links
  const heroLinks = document.getElementById('heroLinks');
  heroLinks.innerHTML = '';

  const socialIcons = {
    github: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`,
    twitter: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    linkedin: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
    dribbble: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.814zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-1.81-1.61-4.19-2.586-6.795-2.586-.825 0-1.63.1-2.4.285zm10.335 3.483c-.218.29-1.91 2.493-5.724 4.04.24.49.47.985.68 1.486.08.18.15.36.22.53 3.41-.43 6.8.26 7.14.33-.02-2.42-.88-4.64-2.31-6.38z"/></svg>`
  };

  Object.entries(profile.social).forEach(([platform, url]) => {
    if (url && socialIcons[platform]) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'btn btn-secondary';
      link.innerHTML = `${socialIcons[platform]} ${platform.charAt(0).toUpperCase() + platform.slice(1)}`;
      heroLinks.appendChild(link);
    }
  });

  // Footer
  document.getElementById('footerName').textContent = profile.name;
  const footerEmail = document.getElementById('footerEmail');
  footerEmail.href = `mailto:${profile.email}`;
  footerEmail.textContent = profile.email;
  document.getElementById('footerYear').textContent = new Date().getFullYear();
  document.getElementById('footerCopyright').textContent = profile.name;

  // Footer social icons
  const footerSocial = document.getElementById('footerSocial');
  footerSocial.innerHTML = '';
  Object.entries(profile.social).forEach(([platform, url]) => {
    if (url && socialIcons[platform]) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.innerHTML = socialIcons[platform];
      link.title = platform.charAt(0).toUpperCase() + platform.slice(1);
      footerSocial.appendChild(link);
    }
  });
}

// ============================================
// Projects Section
// ============================================

function renderProjects(projects) {
  const grid = document.getElementById('projectsGrid');
  grid.innerHTML = '';

  if (!projects || projects.length === 0) {
    grid.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); grid-column: span 2;">暂无作品</p>';
    return;
  }

  projects.forEach((project, index) => {
    const card = document.createElement('div');
    card.className = `project-card fade-in ${project.featured ? 'project-card-featured' : ''}`;
    card.style.transitionDelay = `${index * 0.1}s`;
    card.innerHTML = `
      <img src="${project.coverImage}" alt="${project.title}" class="project-card-image" loading="lazy">
      <div class="project-card-content">
        <span class="project-card-category">${project.category}</span>
        <h3 class="project-card-title">${project.title}</h3>
        <p class="project-card-description">${project.description}</p>
      </div>
    `;
    card.addEventListener('click', () => openProjectModal(project));
    grid.appendChild(card);
  });

  // Trigger fade-in animation
  requestAnimationFrame(() => {
    document.querySelectorAll('.fade-in').forEach(el => {
      el.classList.add('visible');
    });
  });
}

function openProjectModal(project) {
  const modal = document.getElementById('projectModal');
  document.getElementById('projectModalImage').src = project.coverImage;
  document.getElementById('projectModalImage').alt = project.title;
  document.getElementById('projectModalCategory').textContent = project.category;
  document.getElementById('projectModalTitle').textContent = project.title;
  document.getElementById('projectModalDescription').textContent = project.description;
  document.getElementById('projectModalDate').textContent = formatDate(project.date);

  // Gallery
  const gallery = document.getElementById('projectModalGallery');
  gallery.innerHTML = '';
  if (project.images && project.images.length > 1) {
    project.images.slice(1).forEach(img => {
      const imgEl = document.createElement('img');
      imgEl.src = img;
      imgEl.alt = project.title;
      imgEl.loading = 'lazy';
      gallery.appendChild(imgEl);
    });
  }

  // Video
  const videoContainer = document.getElementById('projectModalVideo');
  videoContainer.innerHTML = '';
  if (project.videoUrl) {
    videoContainer.innerHTML = `
      <div class="video-container">
        <iframe src="${project.videoUrl}" allowfullscreen></iframe>
      </div>
    `;
  }

  // Link
  const linkWrapper = document.getElementById('projectModalLinkWrapper');
  const linkEl = document.getElementById('projectModalLink');
  if (project.link) {
    linkWrapper.style.display = 'flex';
    linkEl.href = project.link;
  } else {
    linkWrapper.style.display = 'none';
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// ============================================
// Articles Section
// ============================================

function renderArticles(articles) {
  const list = document.getElementById('articlesList');
  list.innerHTML = '';

  if (!articles || articles.length === 0) {
    list.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); grid-column: span 3;">暂无文章</p>';
    return;
  }

  articles.forEach((article, index) => {
    const card = document.createElement('div');
    card.className = `article-card fade-in`;
    card.style.transitionDelay = `${index * 0.1}s`;
    card.innerHTML = `
      <img src="${article.coverImage}" alt="${article.title}" class="article-card-image" loading="lazy">
      <div class="article-card-content">
        <div class="article-card-date">${formatDate(article.date)}</div>
        <h3 class="article-card-title">${article.title}</h3>
        <p class="article-card-summary">${article.summary}</p>
        <div class="article-card-tags">
          ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
      </div>
    `;
    card.addEventListener('click', () => openArticleModal(article));
    list.appendChild(card);
  });

  // Trigger fade-in animation
  requestAnimationFrame(() => {
    document.querySelectorAll('.fade-in').forEach(el => {
      el.classList.add('visible');
    });
  });
}

function openArticleModal(article) {
  const modal = document.getElementById('articleModal');
  document.getElementById('articleModalImage').src = article.coverImage;
  document.getElementById('articleModalImage').alt = article.title;
  document.getElementById('articleModalTitle').textContent = article.title;
  document.getElementById('articleModalDate').textContent = formatDate(article.date);
  document.getElementById('articleModalBody').innerHTML = parseMarkdown(article.content);

  // Tags
  const tagsContainer = document.getElementById('articleModalTags');
  tagsContainer.innerHTML = article.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// ============================================
// Modal Close
// ============================================

function setupModals() {
  // Project modal
  const projectModal = document.getElementById('projectModal');
  const projectClose = document.getElementById('projectModalClose');

  projectClose.addEventListener('click', () => {
    projectModal.classList.remove('active');
    document.body.style.overflow = '';
  });

  projectModal.addEventListener('click', (e) => {
    if (e.target === projectModal) {
      projectModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  // Article modal
  const articleModal = document.getElementById('articleModal');
  const articleClose = document.getElementById('articleModalClose');

  articleClose.addEventListener('click', () => {
    articleModal.classList.remove('active');
    document.body.style.overflow = '';
  });

  articleModal.addEventListener('click', (e) => {
    if (e.target === articleModal) {
      articleModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      projectModal.classList.remove('active');
      articleModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

// ============================================
// Utility Functions
// ============================================

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('zh-CN', options);
}

function parseMarkdown(md) {
  if (!md) return '';

  // Simple markdown parser
  let html = md
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Unordered lists
    .replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>')
    // Ordered lists
    .replace(/^\s*\d+\.\s+(.*$)/gim, '<li>$1</li>')
    // Paragraphs
    .replace(/\n\n/gim, '</p><p>')
    // Line breaks
    .replace(/\n/gim, '<br>');

  // Wrap lists
  html = html.replace(/(<li>.*<\/li>)/gis, '<ul>$1</ul>');
  // Remove nested ul
  html = html.replace(/<\/ul>\s*<ul>/gim, '');

  return `<p>${html}</p>`;
}

// Smooth scroll for navigation
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// Intersection Observer for fade-in animations
function setupScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
  });
}

// ============================================
// Initialize App
// ============================================

async function init() {
  // Load all data
  const [profile, projectsData, articlesData] = await Promise.all([
    loadData('profile.json'),
    loadData('projects.json'),
    loadData('articles.json')
  ]);

  // Render sections
  renderProfile(profile);
  renderProjects(projectsData?.projects || []);
  renderArticles(articlesData?.articles || []);

  // Setup interactions
  setupModals();
  setupSmoothScroll();

  // Setup scroll animations after a short delay
  setTimeout(setupScrollAnimations, 100);
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
