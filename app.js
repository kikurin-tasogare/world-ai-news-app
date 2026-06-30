/**
 * World AI News — v1
 * タブ操作で最新ニュースを取得し、カテゴリ・レベルでフィルター表示
 */

const DATA_URL = './data/sample-news.json';

const CATEGORIES = [
  'すべて',
  '日常で使えるAI',
  'AIで稼ぐ・ビジネス',
  'セキュリティ',
  '創作・クリエイティブ',
  '社会・倫理',
  'エンジニア向け',
];

const LEVELS = [
  { key: 'すべて', label: 'すべて' },
  { key: '非エンジニアOK', label: '🌸 非エンジニアOK' },
  { key: 'どっちでも', label: '⚡ どっちでも' },
  { key: 'エンジニア向け', label: '🔧 上級者' },
];

const LEVEL_BADGE = {
  '非エンジニアOK': { emoji: '🌸', text: '非エンジニアOK', class: 'beginner' },
  'どっちでも': { emoji: '⚡', text: 'どっちでも', class: 'mixed' },
  'エンジニア向け': { emoji: '🔧', text: '上級者', class: 'engineer' },
};

let allNews = [];
let lastUpdatedAt = null;
let activeCategory = 'すべて';
let activeLevel = 'すべて';
let isLoading = false;

const categoryFiltersEl = document.getElementById('category-filters');
const levelFiltersEl = document.getElementById('level-filters');
const newsListEl = document.getElementById('news-list');
const resultCountEl = document.getElementById('result-count');
const emptyStateEl = document.getElementById('empty-state');
const mainEl = document.querySelector('.main');

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatUpdatedAt(isoStr) {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  return date.toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function parseNewsPayload(data) {
  if (Array.isArray(data)) {
    return { articles: data, updatedAt: null };
  }
  return {
    articles: data.articles || [],
    updatedAt: data.updatedAt || null,
  };
}

function setLoading(loading) {
  isLoading = loading;
  if (mainEl) {
    mainEl.classList.toggle('is-loading', loading);
  }
}

function createFilterButtons(container, items, activeValue, onSelect) {
  container.innerHTML = '';

  items.forEach((item) => {
    const label = typeof item === 'string' ? item : item.label;
    const value = typeof item === 'string' ? item : item.key;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'filter-btn' + (value === activeValue ? ' filter-btn--active' : '');
    btn.textContent = label;
    btn.disabled = isLoading;
    btn.setAttribute('aria-pressed', value === activeValue ? 'true' : 'false');
    btn.addEventListener('click', () => onSelect(value));
    container.appendChild(btn);
  });
}

function getFilteredNews() {
  return allNews.filter((item) => {
    const matchCategory =
      activeCategory === 'すべて' || item.category === activeCategory;
    const matchLevel =
      activeLevel === 'すべて' || item.level === activeLevel;
    return matchCategory && matchLevel;
  });
}

function renderNewsCard(item, index) {
  const badge = LEVEL_BADGE[item.level] || LEVEL_BADGE['どっちでも'];

  return `
    <article class="news-card" style="animation-delay: ${index * 0.05}s">
      <div class="news-card__meta">
        <span class="news-card__category">${escapeHtml(item.category)}</span>
        <span class="news-card__level news-card__level--${badge.class}">
          ${badge.emoji} ${badge.text}
        </span>
        <time class="news-card__date" datetime="${item.date}">
          ${formatDate(item.date)}
        </time>
      </div>
      <h2 class="news-card__title">${escapeHtml(item.title)}</h2>
      <p class="news-card__summary">${escapeHtml(item.summary)}</p>
      <p class="news-card__source">${escapeHtml(item.source)}</p>
    </article>
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function updateResultCount(filteredCount) {
  const updatedLabel = lastUpdatedAt
    ? ` · 更新 ${formatUpdatedAt(lastUpdatedAt)}`
    : '';

  if (isLoading) {
    resultCountEl.textContent = '更新中...';
    return;
  }

  resultCountEl.textContent = `${filteredCount}件のニュース${updatedLabel}`;
}

function renderNewsList() {
  const filtered = getFilteredNews();

  if (filtered.length === 0) {
    newsListEl.innerHTML = '';
    emptyStateEl.hidden = false;
    emptyStateEl.textContent =
      '条件に合うニュースがありません。別のタブを試すか、もう一度タップして更新してください。';
  } else {
    emptyStateEl.hidden = true;
    newsListEl.innerHTML = filtered
      .map((item, i) => renderNewsCard(item, i))
      .join('');
  }

  updateResultCount(filtered.length);
}

function renderFilters() {
  createFilterButtons(categoryFiltersEl, CATEGORIES, activeCategory, (value) => {
    activeCategory = value;
    refreshNews();
  });

  createFilterButtons(levelFiltersEl, LEVELS, activeLevel, (value) => {
    activeLevel = value;
    refreshNews();
  });
}

function render() {
  renderFilters();
  renderNewsList();
}

async function loadNews({ showLoading = true } = {}) {
  if (isLoading) return;

  setLoading(showLoading);
  renderFilters();
  updateResultCount(getFilteredNews().length);

  try {
    const url = `${DATA_URL}?t=${Date.now()}`;
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const { articles, updatedAt } = parseNewsPayload(data);

    allNews = articles;
    lastUpdatedAt = updatedAt || response.headers.get('last-modified');
    allNews.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (err) {
    if (allNews.length === 0) {
      newsListEl.innerHTML = '';
      emptyStateEl.hidden = false;
      emptyStateEl.textContent = navigator.onLine
        ? 'ニュースの読み込みに失敗しました。タブをもう一度タップして更新してください。'
        : 'オフラインです。通信が戻ったらタブをタップして更新してください。';
      resultCountEl.textContent = '';
      console.error('Failed to load news:', err);
      setLoading(false);
      return;
    }
    console.warn('Refresh failed, showing cached news:', err);
  }

  setLoading(false);
  render();
}

function refreshNews() {
  loadNews({ showLoading: true });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}

function setupInstallHint() {
  const hint = document.getElementById('install-hint');
  const closeBtn = document.getElementById('install-hint-close');
  if (!hint || !closeBtn) return;

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  const dismissed = localStorage.getItem('install-hint-dismissed') === '1';

  if (isIOS && !isStandalone && !dismissed) {
    hint.hidden = false;
  }

  closeBtn.addEventListener('click', () => {
    hint.hidden = true;
    localStorage.setItem('install-hint-dismissed', '1');
  });
}

function init() {
  registerServiceWorker();
  setupInstallHint();
  loadNews({ showLoading: false });
}

init();
