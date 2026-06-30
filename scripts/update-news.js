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

const SUMMARY_MAX_LENGTH = 100;
const TRANSLATE_DELAY_MS = 250;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

function extractArticleCore(article) {
  const title = cleanText(article.title);
  let desc = cleanText(article.description || '');

  desc = desc
    .replace(/[\w\s,.-]+,\s+[A-Za-z]+\s+\d{1,2},\s+\d{4}\s+\/PRNewswire\/\s*—\s*/gi, '')
    .replace(/\/PRNewswire\/\s*—\s*/gi, '')
    .replace(/\bRead more\.?\b/gi, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[a-z0-9-]+\.(com|net|org|io)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const sentences = desc
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 30);

  if (sentences.length > 0) {
    return sentences[0];
  }

  if (desc.length >= 30) {
    return desc;
  }

  return title;
}

async function translateToJapanese(text) {
  const input = text.slice(0, 450);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ja&dt=t&q=${encodeURIComponent(input)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Translation failed (${response.status})`);
  }

  const data = await response.json();
  const translated = (data[0] || [])
    .map((part) => part[0])
    .join('')
    .trim();

  if (!translated) {
    throw new Error('Empty translation');
  }

  return translated;
}

function trimSummary(text, maxLen = SUMMARY_MAX_LENGTH) {
  let summary = text.replace(/\s+/g, '').trim();
  summary = summary.replace(/[。！？!?]+$/g, '');

  if (summary.length <= maxLen) {
    return `${summary}。`;
  }

  let cut = summary.slice(0, maxLen);
  const pause = Math.max(
    cut.lastIndexOf('。'),
    cut.lastIndexOf('、'),
    cut.lastIndexOf('，')
  );

  if (pause >= maxLen * 0.55) {
    cut = cut.slice(0, pause);
  } else {
    cut = cut.slice(0, maxLen - 1);
  }

  return `${cut}…`;
}

function buildFallbackSummary(article) {
  const titleJa = localizeTitle(cleanText(article.title));
  return trimSummary(titleJa, SUMMARY_MAX_LENGTH);
}

async function buildJapaneseSummary(article) {
  const core = extractArticleCore(article);

  try {
    const translated = await translateToJapanese(core);
    return trimSummary(translated, SUMMARY_MAX_LENGTH);
  } catch (err) {
    console.warn(`Translation fallback for: ${article.title?.slice(0, 40)} (${err.message})`);
    return buildFallbackSummary(article);
  }
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

async function normalizeArticles(rawArticles) {
  const seen = new Set();

  const selected = rawArticles
    .filter((article) => article.title && article.title !== '[Removed]' && article.url)
    .filter((article) => {
      if (seen.has(article.url)) return false;
      seen.add(article.url);
      return true;
    })
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, MAX_ARTICLES);

  const articles = [];

  for (const [index, article] of selected.entries()) {
    const category = detectCategory(article);
    const level = detectLevel(article, category);
    const summary = await buildJapaneseSummary(article);

    articles.push({
      id: index + 1,
      title: cleanText(article.title),
      summary,
      source: article.source?.name || 'News',
      url: article.url,
      date: toDateString(article.publishedAt || new Date().toISOString()),
      category,
      level,
    });

    if (index < selected.length - 1) {
      await sleep(TRANSLATE_DELAY_MS);
    }
  }

  return articles;
}

async function main() {
  if (!API_KEY) {
    console.error('NEWS_API_KEY が設定されていません。');
    console.error('https://newsapi.org/ で無料キーを取得してください。');
    process.exit(1);
  }

  console.log('Fetching AI news from News API...');
  const rawArticles = await fetchArticles(API_KEY);
  console.log('Generating Japanese summaries...');
  const articles = await normalizeArticles(rawArticles);

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
