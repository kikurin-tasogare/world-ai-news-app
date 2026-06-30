/**
 * World AI News — v1
 * サンプルJSONからニュースを読み込み、カテゴリ・レベルでフィルター表示
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
let activeCategory = 'すべて';
let activeLevel = 'すべて';

const categoryFiltersEl = document.getElementById('category-filters');
const levelFiltersEl = document.getElementById('level-filters');
const newsListEl = document.getElementById('news-list');
const resultCountEl = document.getElementById('result-count');
const emptyStateEl = document.getElementById('empty-state');

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
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

function render() {
  const filtered = getFilteredNews();

  createFilterButtons(categoryFiltersEl, CATEGORIES, activeCategory, (value) => {
    activeCategory = value;
    render();
  });

  createFilterButtons(levelFiltersEl, LEVELS, activeLevel, (value) => {
    activeLevel = value;
    render();
  });

  if (filtered.length === 0) {
    newsListEl.innerHTML = '';
    emptyStateEl.hidden = false;
    resultCountEl.textContent = '0件のニュース';
  } else {
    emptyStateEl.hidden = true;
    newsListEl.innerHTML = filtered
      .map((item, i) => renderNewsCard(item, i))
      .join('');
    resultCountEl.textContent = `${filtered.length}件のニュース`;
  }
}

async function init() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    allNews = await response.json();
    allNews.sort((a, b) => new Date(b.date) - new Date(a.date));
    render();
  } catch (err) {
    newsListEl.innerHTML = '';
    emptyStateEl.hidden = false;
    emptyStateEl.textContent =
      'ニュースの読み込みに失敗しました。ローカルサーバーで開いているか確認してください。';
    resultCountEl.textContent = '';
    console.error('Failed to load news:', err);
  }
}

init();
