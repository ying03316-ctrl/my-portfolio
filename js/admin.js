/**
 * Portfolio Admin - JavaScript
 * 后台管理逻辑
 */

// ============================================
// State
// ============================================

let state = {
  config: {
    token: '',
    repo: '',
    branch: 'main'
  },
  profile: null,
  projects: [],
  articles: [],
  currentSection: 'settings',
  hasChanges: false
};

// ============================================
// GitHub API
// ============================================

// Base64 编码函数，支持 Unicode/中文
function base64Encode(str) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let binary = '';
  bytes.forEach(byte => binary += String.fromCharCode(byte));
  return btoa(binary);
}

// Base64 解码函数，支持 Unicode/中文
function base64Decode(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

// 上传图片到 GitHub
async function uploadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = e.target.result.split(',')[1];
        const ext = file.name.split('.').pop();
        const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
        const path = `assets/images/${filename}`;

        const result = await GitHubAPI.request(`contents/${path}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Upload image: ${filename}`,
            content: base64,
            branch: state.config.branch
          })
        });

        // 返回 raw URL
        const rawUrl = `https://raw.githubusercontent.com/${state.config.repo}/${state.config.branch}/${path}`;
        resolve(rawUrl);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 处理图片上传
async function handleImageUpload(file, inputId, previewId) {
  const statusEl = document.getElementById('saveStatus');
  const icon = statusEl.querySelector('.admin-save-status-icon');
  const text = statusEl.querySelector('.admin-save-status-text');

  // 显示上传中
  icon.className = 'admin-save-status-icon loading';
  text.textContent = '上传图片中...';
  statusEl.classList.add('visible');

  try {
    const url = await uploadImage(file);
    document.getElementById(inputId).value = url;

    // 如果有预览元素，更新预览
    if (previewId) {
      document.getElementById(previewId).src = url;
    }

    icon.className = 'admin-save-status-icon success';
    text.textContent = '图片上传成功！';
    state.hasChanges = true;

    setTimeout(() => {
      statusEl.classList.remove('visible');
    }, 2000);
  } catch (error) {
    icon.className = 'admin-save-status-icon error';
    text.textContent = `上传失败: ${error.message}`;

    setTimeout(() => {
      statusEl.classList.remove('visible');
    }, 3000);
  }
}

const GitHubAPI = {
  async request(endpoint, options = {}) {
    const { token, repo } = state.config;
    if (!token || !repo) {
      throw new Error('请先配置 GitHub Token 和仓库名称');
    }

    const url = `https://api.github.com/repos/${repo}/${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const statusMessages = {
        401: 'Token 无效或已过期，请检查 Token 是否正确',
        403: 'Token 权限不足，需要 repo 权限',
        404: '仓库不存在，请检查仓库名称格式（应为：用户名/仓库名）'
      };
      throw new Error(statusMessages[response.status] || error.message || `GitHub API 错误: ${response.status}`);
    }

    return response.json();
  },

  async getFile(path) {
    try {
      const data = await this.request(`contents/${path}?ref=${state.config.branch}`);
      const content = base64Decode(data.content);
      return { content: JSON.parse(content), sha: data.sha };
    } catch (error) {
      console.error(`获取文件失败: ${path}`, error);
      return null;
    }
  },

  async updateFile(path, content) {
    // 先获取最新的文件信息（包括 SHA）
    console.log(`正在获取 ${path} 的最新信息...`);
    const latestFile = await this.getFile(path);
    console.log(`获取到的文件信息:`, latestFile);

    const body = {
      message: `Update ${path} via Portfolio CMS`,
      content: base64Encode(JSON.stringify(content, null, 2)),
      branch: state.config.branch
    };

    // 使用最新的 SHA
    if (latestFile && latestFile.sha) {
      body.sha = latestFile.sha;
      console.log(`使用 SHA: ${latestFile.sha}`);
    } else {
      console.log('未获取到 SHA，可能是新文件');
    }

    console.log(`正在更新 ${path}...`);
    return this.request(`contents/${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  },

  async testConnection() {
    const { token, repo } = state.config;

    // 基本验证
    if (!token) {
      return { success: false, message: '请填写 Token' };
    }
    if (!repo) {
      return { success: false, message: '请填写仓库名称' };
    }
    if (!repo.includes('/')) {
      return { success: false, message: '仓库名称格式错误，应为：用户名/仓库名' };
    }

    try {
      // 验证 Token
      console.log('正在验证 Token...');
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      console.log('Token 验证响应:', userResponse.status);

      if (!userResponse.ok) {
        if (userResponse.status === 401) {
          return { success: false, message: 'Token 无效或已过期，请重新生成' };
        }
        const errorData = await userResponse.json().catch(() => ({}));
        return { success: false, message: `Token 验证失败: ${errorData.message || userResponse.status}` };
      }

      const user = await userResponse.json();
      console.log('用户验证成功:', user.login);

      // 验证仓库访问
      console.log('正在验证仓库访问...');
      const repoResponse = await fetch(`https://api.github.com/repos/${repo}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      console.log('仓库验证响应:', repoResponse.status);

      if (!repoResponse.ok) {
        if (repoResponse.status === 404) {
          return { success: false, message: `仓库 ${repo} 不存在或无访问权限` };
        }
        if (repoResponse.status === 403) {
          return { success: false, message: 'Token 权限不足，请确保有 Contents 读写权限' };
        }
        const errorData = await repoResponse.json().catch(() => ({}));
        return { success: false, message: `仓库验证失败: ${errorData.message || repoResponse.status}` };
      }

      return { success: true, message: `连接成功！用户: ${user.login}，仓库: ${repo}` };
    } catch (error) {
      console.error('连接测试错误:', error);
      return { success: false, message: `网络错误: ${error.message}` };
    }
  }
};

// ============================================
// Config Management
// ============================================

function loadConfig() {
  const saved = localStorage.getItem('portfolio_config');
  if (saved) {
    state.config = JSON.parse(saved);
    document.getElementById('githubToken').value = state.config.token || '';
    document.getElementById('githubRepo').value = state.config.repo || '';
    document.getElementById('githubBranch').value = state.config.branch || 'main';
  }
}

function saveConfig() {
  state.config = {
    token: document.getElementById('githubToken').value.trim(),
    repo: document.getElementById('githubRepo').value.trim(),
    branch: document.getElementById('githubBranch').value.trim() || 'main'
  };
  localStorage.setItem('portfolio_config', JSON.stringify(state.config));
}

// ============================================
// Data Loading
// ============================================

async function loadAllData() {
  const statusEl = document.getElementById('connectionStatus');
  statusEl.textContent = '加载数据中...';
  statusEl.className = 'admin-status';

  try {
    console.log('开始加载数据...');

    const [profileData, projectsData, articlesData] = await Promise.all([
      GitHubAPI.getFile('data/profile.json'),
      GitHubAPI.getFile('data/projects.json'),
      GitHubAPI.getFile('data/articles.json')
    ]);

    console.log('数据加载结果:', { profileData, projectsData, articlesData });

    if (profileData) {
      state.profile = { ...profileData.content, _sha: profileData.sha };
    }
    if (projectsData) {
      state.projects = projectsData.content.projects || [];
      state._projectsSha = projectsData.sha;
    }
    if (articlesData) {
      state.articles = articlesData.content.articles || [];
      state._articlesSha = articlesData.sha;
    }

    // Render all sections
    renderProfile();
    renderProjectsList();
    renderArticlesList();

    statusEl.textContent = '数据加载成功';
    statusEl.className = 'admin-status success';
  } catch (error) {
    console.error('数据加载失败:', error);
    statusEl.textContent = `加载失败: ${error.message}`;
    statusEl.className = 'admin-status error';
  }
}

// ============================================
// Profile Section
// ============================================

function renderProfile() {
  if (!state.profile) return;

  document.getElementById('profileName').value = state.profile.name || '';
  document.getElementById('profileTitle').value = state.profile.title || '';
  document.getElementById('profileBio').value = state.profile.bio || '';
  document.getElementById('profileAvatar').value = state.profile.avatar || '';
  document.getElementById('profileEmail').value = state.profile.email || '';
  document.getElementById('profileLocation').value = state.profile.location || '';

  // Avatar preview
  const avatarPreview = document.getElementById('avatarPreview');
  avatarPreview.src = state.profile.avatar || '';

  // Social links
  const social = state.profile.social || {};
  document.getElementById('socialGithub').value = social.github || '';
  document.getElementById('socialTwitter').value = social.twitter || '';
  document.getElementById('socialLinkedin').value = social.linkedin || '';
  document.getElementById('socialDribbble').value = social.dribbble || '';
}

function collectProfileData() {
  return {
    name: document.getElementById('profileName').value.trim(),
    title: document.getElementById('profileTitle').value.trim(),
    bio: document.getElementById('profileBio').value.trim(),
    avatar: document.getElementById('profileAvatar').value.trim(),
    email: document.getElementById('profileEmail').value.trim(),
    location: document.getElementById('profileLocation').value.trim(),
    social: {
      github: document.getElementById('socialGithub').value.trim(),
      twitter: document.getElementById('socialTwitter').value.trim(),
      linkedin: document.getElementById('socialLinkedin').value.trim(),
      dribbble: document.getElementById('socialDribbble').value.trim()
    }
  };
}

// ============================================
// Projects Section
// ============================================

function renderProjectsList() {
  const list = document.getElementById('projectsList');
  list.innerHTML = '';

  if (state.projects.length === 0) {
    list.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); padding: 2rem;">暂无作品，点击上方按钮添加</p>';
    return;
  }

  state.projects.forEach((project, index) => {
    const item = document.createElement('div');
    item.className = 'admin-list-item';
    item.innerHTML = `
      <img src="${project.coverImage || ''}" alt="${project.title}" class="admin-list-item-image"
           onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 80 60%22><rect fill=%22%23f5f5f7%22 width=%2280%22 height=%2260%22/></svg>'">
      <div class="admin-list-item-content">
        <div class="admin-list-item-title">${project.title}</div>
        <div class="admin-list-item-meta">${project.category} · ${formatDate(project.date)}</div>
      </div>
      <div class="admin-list-item-actions">
        <button class="btn btn-ghost" onclick="editProject(${index})">编辑</button>
        <button class="btn btn-ghost" style="color: #ff3b30;" onclick="deleteProject(${index})">删除</button>
      </div>
    `;
    list.appendChild(item);
  });
}

function editProject(index) {
  const project = index >= 0 ? state.projects[index] : null;
  const modal = document.getElementById('projectEditModal');
  const title = document.getElementById('projectEditTitle');

  if (project) {
    title.textContent = '编辑作品';
    document.getElementById('projectId').value = index;
    document.getElementById('projectTitle').value = project.title || '';
    document.getElementById('projectCategory').value = project.category || '';
    document.getElementById('projectDescription').value = project.description || '';
    document.getElementById('projectCover').value = project.coverImage || '';
    document.getElementById('projectVideo').value = project.videoUrl || '';
    document.getElementById('projectLink').value = project.link || '';
    document.getElementById('projectDate').value = project.date || '';
    document.getElementById('projectFeatured').checked = project.featured || false;

    // Render images list
    renderProjectImages(project.images || []);
  } else {
    title.textContent = '添加作品';
    document.getElementById('projectId').value = '';
    document.getElementById('projectTitle').value = '';
    document.getElementById('projectCategory').value = '';
    document.getElementById('projectDescription').value = '';
    document.getElementById('projectCover').value = '';
    document.getElementById('projectVideo').value = '';
    document.getElementById('projectLink').value = '';
    document.getElementById('projectDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('projectFeatured').checked = false;

    renderProjectImages([]);
  }

  modal.classList.add('active');
}

function renderProjectImages(images) {
  const list = document.getElementById('projectImagesList');
  list.innerHTML = '';

  images.forEach((url, index) => {
    const tag = document.createElement('div');
    tag.className = 'admin-image-tag';
    tag.innerHTML = `
      <img src="${url}" alt="Image ${index + 1}">
      <span>图片 ${index + 1}</span>
      <button onclick="removeProjectImage(${index})">&times;</button>
    `;
    list.appendChild(tag);
  });

  // Store current images
  list.dataset.images = JSON.stringify(images);
}

function addProjectImage() {
  const input = document.getElementById('projectNewImage');
  const url = input.value.trim();
  if (!url) return;

  const list = document.getElementById('projectImagesList');
  const images = JSON.parse(list.dataset.images || '[]');
  images.push(url);
  renderProjectImages(images);
  input.value = '';
}

function removeProjectImage(index) {
  const list = document.getElementById('projectImagesList');
  const images = JSON.parse(list.dataset.images || '[]');
  images.splice(index, 1);
  renderProjectImages(images);
}

function saveProject() {
  const index = document.getElementById('projectId').value;
  const list = document.getElementById('projectImagesList');
  const images = JSON.parse(list.dataset.images || '[]');

  const project = {
    id: index >= 0 ? state.projects[index].id : `proj-${Date.now()}`,
    title: document.getElementById('projectTitle').value.trim(),
    category: document.getElementById('projectCategory').value.trim(),
    description: document.getElementById('projectDescription').value.trim(),
    coverImage: document.getElementById('projectCover').value.trim(),
    images: images,
    videoUrl: document.getElementById('projectVideo').value.trim(),
    link: document.getElementById('projectLink').value.trim(),
    date: document.getElementById('projectDate').value,
    featured: document.getElementById('projectFeatured').checked
  };

  if (!project.title) {
    alert('请输入标题');
    return;
  }

  if (index >= 0) {
    state.projects[index] = project;
  } else {
    state.projects.push(project);
  }

  state.hasChanges = true;
  renderProjectsList();
  closeProjectModal();
}

function deleteProject(index) {
  if (!confirm('确定要删除这个作品吗？')) return;

  state.projects.splice(index, 1);
  state.hasChanges = true;
  renderProjectsList();
}

function closeProjectModal() {
  document.getElementById('projectEditModal').classList.remove('active');
}

// ============================================
// Articles Section
// ============================================

function renderArticlesList() {
  const list = document.getElementById('articlesList');
  list.innerHTML = '';

  if (state.articles.length === 0) {
    list.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); padding: 2rem;">暂无文章，点击上方按钮添加</p>';
    return;
  }

  state.articles.forEach((article, index) => {
    const item = document.createElement('div');
    item.className = 'admin-list-item';
    item.innerHTML = `
      <img src="${article.coverImage || ''}" alt="${article.title}" class="admin-list-item-image"
           onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 80 60%22><rect fill=%22%23f5f5f7%22 width=%2280%22 height=%2260%22/></svg>'">
      <div class="admin-list-item-content">
        <div class="admin-list-item-title">${article.title}</div>
        <div class="admin-list-item-meta">${formatDate(article.date)} · ${(article.tags || []).join(', ')}</div>
      </div>
      <div class="admin-list-item-actions">
        <button class="btn btn-ghost" onclick="editArticle(${index})">编辑</button>
        <button class="btn btn-ghost" style="color: #ff3b30;" onclick="deleteArticle(${index})">删除</button>
      </div>
    `;
    list.appendChild(item);
  });
}

function editArticle(index) {
  const article = index >= 0 ? state.articles[index] : null;
  const modal = document.getElementById('articleEditModal');
  const title = document.getElementById('articleEditTitle');

  if (article) {
    title.textContent = '编辑文章';
    document.getElementById('articleId').value = index;
    document.getElementById('articleTitleInput').value = article.title || '';
    document.getElementById('articleSummary').value = article.summary || '';
    document.getElementById('articleContent').value = article.content || '';
    document.getElementById('articleCover').value = article.coverImage || '';
    document.getElementById('articleDate').value = article.date || '';

    renderArticleTags(article.tags || []);
  } else {
    title.textContent = '添加文章';
    document.getElementById('articleId').value = '';
    document.getElementById('articleTitleInput').value = '';
    document.getElementById('articleSummary').value = '';
    document.getElementById('articleContent').value = '';
    document.getElementById('articleCover').value = '';
    document.getElementById('articleDate').value = new Date().toISOString().split('T')[0];

    renderArticleTags([]);
  }

  modal.classList.add('active');
}

function renderArticleTags(tags) {
  const list = document.getElementById('articleTagsList');
  list.innerHTML = '';

  tags.forEach((tag, index) => {
    const tagEl = document.createElement('div');
    tagEl.className = 'admin-tag';
    tagEl.innerHTML = `
      <span>${tag}</span>
      <button onclick="removeArticleTag(${index})">&times;</button>
    `;
    list.appendChild(tagEl);
  });

  list.dataset.tags = JSON.stringify(tags);
}

function addArticleTag() {
  const input = document.getElementById('articleNewTag');
  const tag = input.value.trim();
  if (!tag) return;

  const list = document.getElementById('articleTagsList');
  const tags = JSON.parse(list.dataset.tags || '[]');
  tags.push(tag);
  renderArticleTags(tags);
  input.value = '';
}

function removeArticleTag(index) {
  const list = document.getElementById('articleTagsList');
  const tags = JSON.parse(list.dataset.tags || '[]');
  tags.splice(index, 1);
  renderArticleTags(tags);
}

function saveArticle() {
  const index = document.getElementById('articleId').value;
  const list = document.getElementById('articleTagsList');
  const tags = JSON.parse(list.dataset.tags || '[]');

  const article = {
    id: index >= 0 ? state.articles[index].id : `art-${Date.now()}`,
    title: document.getElementById('articleTitleInput').value.trim(),
    summary: document.getElementById('articleSummary').value.trim(),
    content: document.getElementById('articleContent').value.trim(),
    coverImage: document.getElementById('articleCover').value.trim(),
    date: document.getElementById('articleDate').value,
    tags: tags
  };

  if (!article.title) {
    alert('请输入标题');
    return;
  }

  if (index >= 0) {
    state.articles[index] = article;
  } else {
    state.articles.push(article);
  }

  state.hasChanges = true;
  renderArticlesList();
  closeArticleModal();
}

function deleteArticle(index) {
  if (!confirm('确定要删除这篇文章吗？')) return;

  state.articles.splice(index, 1);
  state.hasChanges = true;
  renderArticlesList();
}

function closeArticleModal() {
  document.getElementById('articleEditModal').classList.remove('active');
}

// ============================================
// Save to GitHub
// ============================================

async function saveAllChanges() {
  const statusEl = document.getElementById('saveStatus');
  const icon = statusEl.querySelector('.admin-save-status-icon');
  const text = statusEl.querySelector('.admin-save-status-text');

  // Show loading
  icon.className = 'admin-save-status-icon loading';
  text.textContent = '保存中...';
  statusEl.classList.add('visible');

  try {
    // Save profile
    const profileData = collectProfileData();
    await GitHubAPI.updateFile('data/profile.json', profileData);

    // Save projects
    await GitHubAPI.updateFile('data/projects.json', { projects: state.projects });

    // Save articles
    await GitHubAPI.updateFile('data/articles.json', { articles: state.articles });

    // Reload data to get new SHAs
    await loadAllData();

    state.hasChanges = false;

    icon.className = 'admin-save-status-icon success';
    text.textContent = '保存成功！GitHub Pages 更新需要 1-2 分钟...';

    setTimeout(() => {
      statusEl.classList.remove('visible');
    }, 5000);
  } catch (error) {
    icon.className = 'admin-save-status-icon error';
    text.textContent = `保存失败: ${error.message}`;

    setTimeout(() => {
      statusEl.classList.remove('visible');
    }, 5000);
  }
}

// ============================================
// Navigation
// ============================================

function switchSection(section) {
  state.currentSection = section;

  // Update nav
  document.querySelectorAll('.admin-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.section === section);
  });

  // Update sections
  document.querySelectorAll('.admin-section').forEach(el => {
    el.classList.add('hidden');
  });
  document.getElementById(`${section}Section`).classList.remove('hidden');
}

// ============================================
// Utility Functions
// ============================================

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('zh-CN', options);
}

// ============================================
// Event Listeners
// ============================================

function setupEventListeners() {
  // Navigation
  document.querySelectorAll('.admin-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      switchSection(item.dataset.section);
    });
  });

  // Settings
  document.getElementById('testConnectionBtn').addEventListener('click', async () => {
    saveConfig();
    const result = await GitHubAPI.testConnection();
    const statusEl = document.getElementById('connectionStatus');
    statusEl.textContent = result.message;
    statusEl.className = `admin-status ${result.success ? 'success' : 'error'}`;

    if (result.success) {
      await loadAllData();
    }
  });

  // Save all
  document.getElementById('saveAllBtn').addEventListener('click', saveAllChanges);

  // Projects
  document.getElementById('addProjectBtn').addEventListener('click', () => editProject(-1));
  document.getElementById('projectEditClose').addEventListener('click', closeProjectModal);
  document.getElementById('projectEditCancel').addEventListener('click', closeProjectModal);
  document.getElementById('projectEditSave').addEventListener('click', saveProject);
  document.getElementById('addProjectImageBtn').addEventListener('click', addProjectImage);

  // Articles
  document.getElementById('addArticleBtn').addEventListener('click', () => editArticle(-1));
  document.getElementById('articleEditClose').addEventListener('click', closeArticleModal);
  document.getElementById('articleEditCancel').addEventListener('click', closeArticleModal);
  document.getElementById('articleEditSave').addEventListener('click', saveArticle);
  document.getElementById('addArticleTagBtn').addEventListener('click', addArticleTag);

  // Avatar preview
  document.getElementById('profileAvatar').addEventListener('input', (e) => {
    document.getElementById('avatarPreview').src = e.target.value;
  });

  // Enter key for tags and images
  document.getElementById('projectNewImage').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addProjectImage();
    }
  });

  document.getElementById('articleNewTag').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addArticleTag();
    }
  });

  // File upload handlers
  document.getElementById('avatarFileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await handleImageUpload(file, 'profileAvatar', 'avatarPreview');
  });

  document.getElementById('projectCoverInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await handleImageUpload(file, 'projectCover');
  });

  document.getElementById('articleCoverInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await handleImageUpload(file, 'articleCover');
  });

  // Close modals on overlay click
  document.getElementById('projectEditModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeProjectModal();
  });

  document.getElementById('articleEditModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeArticleModal();
  });

  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProjectModal();
      closeArticleModal();
    }
  });

  // Warn before leaving with unsaved changes
  window.addEventListener('beforeunload', (e) => {
    if (state.hasChanges) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

// ============================================
// Initialize
// ============================================

function init() {
  loadConfig();
  setupEventListeners();

  // If config exists, try to load data
  if (state.config.token && state.config.repo) {
    loadAllData();
  }
}

// Start
document.addEventListener('DOMContentLoaded', init);
