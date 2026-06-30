/**
 * World AI News — ニュース自動更新スクリプト (v2)
 * News API から記事を取得し、data/sample-news.json を生成する
 *
 * 使い方:
 *   NEWS_API_KEY=your_key node scripts/update-news.js
 */

const fs = require('fs');
const path = require('path');

const OUTPUT = path.join(__dirname, '..', 'data', 'sample-news.json');
const MAX_ARTICLES = 25;
const API_KEY = process.env.NEWS_API_KEY;

const CATEGORY_RULES = [
  {
    category: '日常で使えるAI',
    keywords: [
      'chatgpt', 'gemini', 'copilot', 'siri', 'alexa', 'iphone', 'android',
      'google assistant', 'claude app', 'smartphone', 'voice assistant',
    ],
  },
  {
    category: 'AIで稼ぐ・ビジネス',
    keywords: [
      'business', 'freelance', 'startup', 'productivity', 'marketing',
      'sales', 'tool', 'saas', 'workflow', 'enterprise', 'revenue',
    ],
  },
  {
    category: 'セキュリティ',
    keywords: [
      'security', 'scam', 'fraud', 'deepfake', 'hack', 'privacy', 'password',
      'phishing', 'malware', 'cyber', 'fake', 'voice cloning',
    ],
  },
  {
    category: '創作・クリエイティブ',
    keywords: [
      'image', 'video', 'music', 'art', 'creative', 'midjourney', 'dall-e',
      'writing', 'design', 'content', 'generation', 'sora', 'stable diffusion',
    ],
  },
  {
    category: '社会・倫理',
    keywords: [
      'regulation', 'ethics', 'law', 'job', 'employment', 'society', 'policy',
      'government', 'eu', 'ban', 'copyright', 'bias', 'human',
    ],
  },
  {
    category: 'エンジニア向け',
    keywords: [
      'model', 'api', 'open source', 'github', 'benchmark', 'parameter',
      'inference', 'training', 'llm', 'transformer', 'nvidia', 'cuda',
      'research', 'paper', 'release', 'sdk', 'developer',
    ],
  },
];

const BEGINNER_KEYWORDS = [
  'chatgpt', 'gemini', 'scam', 'fraud', 'how to', 'guide', 'tips',
  'iphone', 'app', 'tool', 'beginner', 'everyday', 'voice cloning',
];

const ENGINEER_KEYWORDS = [
  'api', 'open source', 'benchmark', 'parameter', 'inference', 'training',
  'sdk', 'developer', 'github', 'nvidia', 'pytorch', 'tensorflow',
  'token', 'context window', 'architecture', 'research paper',
];

const TERM_JA = {
  'artificial intelligence': '人工知能',
  'machine learning': '機械学習',
  'deep learning': '深層学習',
  'ChatGPT': 'ChatGPT',
  'OpenAI': 'OpenAI',
  'Google': 'Google',
  'Gemini': 'Gemini',
  'Claude': 'Claude',
  'Anthropic': 'Anthropic',
  'AI': 'AI',
  'LLM': '大規模言語モデル',
  'generative AI': '生成AI',
};

const CATEGORY_INTROS = {
  '日常で使えるAI': '日常生活や仕事ですぐ試せるAIの話題です。',
  'AIで稼ぐ・ビジネス': '仕事や副業に活かせるAIのビジネスニュースです。',
  'セキュリティ': 'AIを悪用した犯罪や安全対策の話題です。知っておくと安心です。',
  '創作・クリエイティブ': '画像・文章・動画など、創作に使えるAIの話題です。',
  '社会・倫理': 'AIと社会・仕事・法律の関係についてのニュースです。',
  'エンジニア向け': '新モデルや技術アップデートなど、開発者向けの話題です。',
};

function cleanText(text) {
  if (!text) return '';
  return text.replace(/\[\+\d*\s*chars\]$/i, '').replace(/\s+/g, ' ').trim();
}

function localizeTitle(title) {
  let result = title;
  for (const [en, ja] of Object.entries(TERM_JA)) {
    result = result.replace(new RegExp(en, 'gi'), ja);
  }
  return result;
}

function scoreKeywords(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.reduce((score, word) => (lower.includes(word) ? score + 1 : score), 0);
}

function detectCategory(article) {
  const text = `${article.title} ${article.description || ''}`.toLowerCase();
  let best = { category: '社会・倫理', score: 0 };

  for (const rule of CATEGORY_RULES) {
    const score = scoreKeywords(text, rule.keywords);
    if (score > best.score) {
      best = { category: rule.category, score };
    }
  }

  return best.category;
}

function detectLevel(article, category) {
  const text = `${article.title} ${article.description || ''}`.toLowerCase();

  if (category === 'エンジニア向け' || scoreKeywords(text, ENGINEER_KEYWORDS) >= 2) {
    return 'エンジニア向け';
  }

  if (scoreKeywords(text, BEGINNER_KEYWORDS) >= 1 || category === 'セキュリティ') {
    return '非エンジニアOK';
  }

  return 'どっちでも';
}

function buildJapaneseSummary(article, category) {
  const source = article.source?.name || '海外メディア';
  const intro = CATEGORY_INTROS[category] || 'AI関連の最新ニュースです。';
  const titleJa = localizeTitle(cleanText(article.title));
  const desc = cleanText(article.description);

  if (desc.length >= 40) {
    const excerpt = desc.length > 90 ? `${desc.slice(0, 90)}…` : desc;
    return `${source}から届いたニュースです。${intro}「${titleJa}」が話題になっており、${excerpt} くわしくは元記事から確認できます。`;
  }

  return `${source}から届いたニュースです。${intro}「${titleJa}」について報じられています。気になったら元記事をタップしてみてください。`;
}

function toDateString(isoDate) {
  return isoDate.slice(0, 10);
}

async function fetchArticles(apiKey) {
  const endpoints = [
    `https://newsapi.org/v2/everything?q=(artificial intelligence OR ChatGPT OR OpenAI OR Gemini OR Claude OR generative AI)&sortBy=publishedAt&pageSize=30&language=en`,
    `https://newsapi.org/v2/top-headlines?category=technology&q=AI&pageSize=20`,
  ];

  const articles = [];

  for (const endpoint of endpoints) {
    const url = `${endpoint}&apiKey=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url);

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`News API error (${response.status}): ${body}`);
    }

    const data = await response.json();
    if (data.status !== 'ok') {
      throw new Error(`News API status: ${data.message || 'unknown error'}`);
    }

    articles.push(...(data.articles || []));
  }

  return articles;
}

function normalizeArticles(rawArticles) {
  const seen = new Set();

  return rawArticles
    .filter((article) => article.title && article.title !== '[Removed]' && article.url)
    .filter((article) => {
      if (seen.has(article.url)) return false;
      seen.add(article.url);
      return true;
    })
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, MAX_ARTICLES)
    .map((article, index) => {
      const category = detectCategory(article);
      const level = detectLevel(article, category);

      return {
        id: index + 1,
        title: cleanText(article.title),
        summary: buildJapaneseSummary(article, category),
        source: article.source?.name || 'News',
        url: article.url,
        date: toDateString(article.publishedAt || new Date().toISOString()),
        category,
        level,
      };
    });
}

async function main() {
  if (!API_KEY) {
    console.error('NEWS_API_KEY が設定されていません。');
    console.error('https://newsapi.org/ で無料キーを取得してください。');
    process.exit(1);
  }

  console.log('Fetching AI news from News API...');
  const rawArticles = await fetchArticles(API_KEY);
  const articles = normalizeArticles(rawArticles);

  if (articles.length === 0) {
    throw new Error('取得できた記事が0件でした。');
  }

  const payload = {
    updatedAt: new Date().toISOString(),
    source: 'News API',
    articles,
  };

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`Updated ${OUTPUT} with ${articles.length} articles.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
