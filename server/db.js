import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, 'modelpulse.db');
const JSON_DB_FILE = path.join(__dirname, 'modelpulse_db.json');

// We use a hybrid database layer. If sqlite3 is installed and compiled correctly, we use it.
// Otherwise, we fallback to a pure JSON database.
let dbInstance = null;
let useJsonFallback = false;

// Mock SQL parser / simple JSON engine for the fallback
class JsonDatabase {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = {
      providers: [],
      models: [],
      events: [],
      users: [],
      pending_articles: []
    };
    this.load();
  }

  load() {
    if (fs.existsSync(this.filePath)) {
      try {
        const fileContent = fs.readFileSync(this.filePath, 'utf8');
        this.data = JSON.parse(fileContent);
      } catch (err) {
        console.error('Failed to load JSON DB, initializing fresh:', err);
      }
    } else {
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to save JSON DB:', err);
    }
  }

  run(query, params = [], callback) {
    // Simple mock queries
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.startsWith('insert into providers')) {
      const provider = { id: params[0], name: params[1], logo_url: params[2], website: params[3] };
      this.data.providers = this.data.providers.filter(p => p.id !== provider.id);
      this.data.providers.push(provider);
    } else if (lowerQuery.startsWith('insert into models')) {
      const model = { id: params[0], provider_id: params[1], name: params[2], release_date: params[3], current_status: params[4], description: params[5] };
      this.data.models = this.data.models.filter(m => m.id !== model.id);
      this.data.models.push(model);
    } else if (lowerQuery.startsWith('insert into events')) {
      const event = {
        id: params[0], model_id: params[1], event_type: params[2], summary: params[3],
        raw_source_text: params[4], source_url: params[5], published_date: params[6],
        impact_score: params[7], region_affected: params[8], is_verified: params[9]
      };
      this.data.events = this.data.events.filter(e => e.id !== event.id);
      this.data.events.push(event);
    } else if (lowerQuery.startsWith('insert into users')) {
      const user = { id: params[0], email: params[1], role: params[2] };
      this.data.users = this.data.users.filter(u => u.id !== user.id);
      this.data.users.push(user);
    } else if (lowerQuery.startsWith('insert into pending_articles')) {
      const article = { id: params[0], title: params[1], source: params[2], article_text: params[3], source_url: params[4], published_date: params[5] };
      this.data.pending_articles = this.data.pending_articles.filter(a => a.id !== article.id);
      this.data.pending_articles.push(article);
    } else if (lowerQuery.startsWith('update events set')) {
      // Very simple update implementation for the dashboard admin approval
      // "UPDATE events SET event_type = ?, summary = ?, impact_score = ?, region_affected = ?, is_verified = ? WHERE id = ?"
      const eventId = params[5];
      const event = this.data.events.find(e => e.id === eventId);
      if (event) {
        event.event_type = params[0];
        event.summary = params[1];
        event.impact_score = params[2];
        event.region_affected = params[3];
        event.is_verified = params[4];
      }
    } else if (lowerQuery.startsWith('update models set current_status =')) {
      // UPDATE models SET current_status = ? WHERE id = ?
      const modelId = params[1];
      const model = this.data.models.find(m => m.id === modelId);
      if (model) {
        model.current_status = params[0];
      }
    } else if (lowerQuery.startsWith('delete from pending_articles where id =')) {
      const id = params[0];
      this.data.pending_articles = this.data.pending_articles.filter(a => a.id !== id);
    } else if (lowerQuery.startsWith('delete from events where id =')) {
      const id = params[0];
      this.data.events = this.data.events.filter(e => e.id !== id);
    }

    this.save();
    if (callback) callback(null);
  }

  all(query, params = [], callback) {
    const lowerQuery = query.toLowerCase();
    
    // Select * from providers
    if (lowerQuery.includes('from providers')) {
      callback(null, this.data.providers);
      return;
    }

    // Select * from models
    if (lowerQuery.includes('from models')) {
      // Joining provider info if needed, but we can do it in memory
      const result = this.data.models.map(m => {
        const provider = this.data.providers.find(p => p.id === m.provider_id);
        return {
          ...m,
          provider_name: provider ? provider.name : '',
          provider_logo_url: provider ? provider.logo_url : ''
        };
      });
      callback(null, result);
      return;
    }

    // Select * from events
    if (lowerQuery.includes('from events')) {
      // Join model and provider
      let result = this.data.events.map(e => {
        const model = this.data.models.find(m => m.id === e.model_id);
        const provider = model ? this.data.providers.find(p => p.id === model.provider_id) : null;
        return {
          ...e,
          model_name: model ? model.name : 'Unknown Model',
          provider_id: model ? model.provider_id : 'unknown',
          provider_name: provider ? provider.name : 'Unknown Provider',
          provider_logo_url: provider ? provider.logo_url : ''
        };
      });
      callback(null, result);
      return;
    }

    // Select * from pending_articles
    if (lowerQuery.includes('from pending_articles')) {
      callback(null, this.data.pending_articles);
      return;
    }

    // Select * from users
    if (lowerQuery.includes('from users')) {
      callback(null, this.data.users);
      return;
    }

    callback(null, []);
  }

  get(query, params = [], callback) {
    this.all(query, params, (err, rows) => {
      if (err) callback(err, null);
      else callback(null, rows[0] || null);
    });
  }
}

// Attempt to load sqlite3
try {
  const sqlite3Module = await import('sqlite3');
  const sqlite3 = sqlite3Module.default.verbose();
  
  dbInstance = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
      console.warn('Failed to open SQLite database file, falling back to JSON db:', err);
      setupJsonFallback();
    } else {
      console.log('SQLite database opened successfully at', DB_FILE);
    }
  });
} catch (err) {
  console.warn('sqlite3 package could not be imported (likely native compilation skipped). Falling back to pure JSON Database.');
  setupJsonFallback();
}

function setupJsonFallback() {
  useJsonFallback = true;
  dbInstance = new JsonDatabase(JSON_DB_FILE);
  console.log('JSON database initialized successfully at', JSON_DB_FILE);
}

// DB interfaces wrapped as Promises
export const db = {
  run: (query, params = []) => {
    return new Promise((resolve, reject) => {
      if (useJsonFallback) {
        dbInstance.run(query, params, (err) => {
          if (err) reject(err);
          else resolve({ lastID: this ? this.lastID : null, changes: this ? this.changes : null });
        });
      } else {
        dbInstance.run(query, params, function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      }
    });
  },
  all: (query, params = []) => {
    return new Promise((resolve, reject) => {
      dbInstance.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  get: (query, params = []) => {
    return new Promise((resolve, reject) => {
      dbInstance.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
};

// Initialize DB schema and Seed Data
export async function initializeDatabase() {
  if (!useJsonFallback) {
    // Setup tables in SQLite
    await db.run(`
      CREATE TABLE IF NOT EXISTS providers (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE,
        logo_url TEXT,
        website TEXT
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS models (
        id TEXT PRIMARY KEY,
        provider_id TEXT,
        name TEXT,
        release_date TEXT,
        current_status TEXT,
        description TEXT,
        FOREIGN KEY(provider_id) REFERENCES providers(id)
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        model_id TEXT,
        event_type TEXT,
        summary TEXT,
        raw_source_text TEXT,
        source_url TEXT,
        published_date TEXT,
        impact_score TEXT,
        region_affected TEXT,
        is_verified INTEGER DEFAULT 1,
        FOREIGN KEY(model_id) REFERENCES models(id)
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        role TEXT DEFAULT 'viewer'
      )
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS pending_articles (
        id TEXT PRIMARY KEY,
        title TEXT,
        source TEXT,
        article_text TEXT,
        source_url TEXT,
        published_date TEXT
      )
    `);
  }

  // Check if seeding is needed
  const providersCount = await db.all(`SELECT count(*) as count FROM providers`);
  if (providersCount[0].count === 0) {
    console.log('Seeding Database with AI Providers, Models, and 20 lifecycle events...');
    
    // 1. Providers
    const providers = [
      ['openai', 'OpenAI', 'https://logo.clearbit.com/openai.com', 'https://openai.com'],
      ['anthropic', 'Anthropic', 'https://logo.clearbit.com/anthropic.com', 'https://anthropic.com'],
      ['google', 'Google DeepMind', 'https://logo.clearbit.com/google.com', 'https://deepmind.google'],
      ['meta', 'Meta', 'https://logo.clearbit.com/meta.com', 'https://meta.ai'],
      ['mistral', 'Mistral AI', 'https://logo.clearbit.com/mistral.ai', 'https://mistral.ai']
    ];

    for (const p of providers) {
      await db.run(`INSERT INTO providers (id, name, logo_url, website) VALUES (?, ?, ?, ?)`, p);
    }

    // 2. Models
    const models = [
      ['gpt-4o', 'openai', 'GPT-4o', '2024-05-13', 'available', 'Omni model integrating text, vision, and audio natively.'],
      ['gpt-4-turbo', 'openai', 'GPT-4 Turbo', '2023-11-06', 'available', 'High-intelligence text and vision model with broad knowledge base.'],
      ['gpt-3.5-turbo', 'openai', 'GPT-3.5 Turbo', '2023-03-01', 'deprecated', 'Legacy cost-efficient model replaced by GPT-4o mini.'],
      ['gpt-4o-mini', 'openai', 'GPT-4o mini', '2024-07-18', 'available', 'Highly cost-effective small model for lightweight tasks.'],
      
      ['claude-3-5-sonnet', 'anthropic', 'Claude 3.5 Sonnet', '2024-06-20', 'available', 'State-of-the-art model balancing speed, cost, and advanced coding capability.'],
      ['claude-3-opus', 'anthropic', 'Claude 3 Opus', '2024-03-04', 'available', 'Most powerful model in the Claude 3 family for complex reasoning.'],
      ['claude-3-haiku', 'anthropic', 'Claude 3 Haiku', '2024-03-13', 'available', 'Fastest and most cost-effective model for speed-oriented workflows.'],
      
      ['gemini-1-5-pro', 'google', 'Gemini 1.5 Pro', '2024-05-14', 'available', 'Multimodal model with a breakthrough 2-million token context window.'],
      ['gemini-1-5-flash', 'google', 'Gemini 1.5 Flash', '2024-05-14', 'available', 'Lightweight, fast, and cost-efficient multimodal model.'],
      
      ['llama-3-1-405b', 'meta', 'Llama 3.1 405B', '2024-07-23', 'available', 'Massive open-weights model comparable to top proprietary frontier models.'],
      ['llama-3-1-70b', 'meta', 'Llama 3.1 70B', '2024-07-23', 'available', 'Highly capable open-weights model for agentic and reasoning tasks.'],
      
      ['mistral-large-2', 'mistral', 'Mistral Large 2', '2024-07-24', 'available', 'Mistral flagship model with advanced multilingual and coding skills.'],
      ['codestral', 'mistral', 'Codestral', '2024-05-29', 'available', 'Specialized model designed specifically for code generation tasks.']
    ];

    for (const m of models) {
      await db.run(`INSERT INTO models (id, provider_id, name, release_date, current_status, description) VALUES (?, ?, ?, ?, ?, ?)`, m);
    }

    // 3. Events (20 items spanning: launch, update, deprecation, restriction, pricing_change)
    const events = [
      [
        'evt-001', 'gpt-4o', 'launch',
        'OpenAI launches its new flagship model, GPT-4o ("o" for omni), integrating text, vision, and audio natively into a single model, making it twice as fast and 50% cheaper than GPT-4 Turbo.',
        'We are introducing GPT-4o, our new flagship model that can reason across audio, vision, and text in real time. It is twice as fast, 50% cheaper, and has higher rate limits than GPT-4 Turbo.',
        'https://openai.com/index/hello-gpt-4o/', '2024-05-13', 'major', 'Global', 1
      ],
      [
        'evt-002', 'gemini-1-5-pro', 'launch',
        'Google DeepMind announces the general availability of Gemini 1.5 Pro, featuring a native 1-million token context window (expandable to 2 million) and native multimodal reasoning.',
        'Today we are launching Gemini 1.5 Pro to developers globally. It includes a revolutionary context window of up to 2 million tokens, enabling it to process hours of video, audio, or large repositories.',
        'https://deepmind.google/technologies/gemini/', '2024-05-14', 'major', 'Global', 1
      ],
      [
        'evt-003', 'gemini-1-5-flash', 'launch',
        'Google launches Gemini 1.5 Flash, a lighter weight, faster, and highly cost-efficient model designed for high-frequency, low-latency tasks.',
        'Gemini 1.5 Flash is our new lightweight model. It is optimized for speed and cost-efficiency, delivering impressive multimodal performance at a fraction of the cost.',
        'https://deepmind.google/technologies/gemini/', '2024-05-14', 'minor', 'Global', 1
      ],
      [
        'evt-004', 'codestral', 'launch',
        'Mistral AI releases Codestral, a 22B parameter open-weights model tailored specifically for coding tasks, supporting over 80 programming languages.',
        'Codestral is an open-weights generative AI model explicitly designed for code generation tasks. It helps developers write, debug, and auto-complete code efficiently.',
        'https://mistral.ai/news/codestral/', '2024-05-29', 'minor', 'Global', 1
      ],
      [
        'evt-005', 'gemini-1-5-pro', 'restriction',
        'Google pauses certain advanced Gemini features in the European Union while working with regulators to ensure compliance with European privacy guidelines.',
        'We are temporarily delaying the rollout of advanced Gemini workspace assistant features in the EU to ensure proper alignment with local regulatory and privacy bodies.',
        'https://support.google.com/gemini/answer/14589333', '2024-06-18', 'major', 'European Union', 1
      ],
      [
        'evt-006', 'claude-3-5-sonnet', 'launch',
        'Anthropic releases Claude 3.5 Sonnet, setting new industry benchmarks for graduate-level reasoning, undergraduate-level knowledge, and coding proficiency.',
        'Today we are releasing Claude 3.5 Sonnet, our first model in the Claude 3.5 family. It outperforms competitor models and our previous Claude 3 Opus at twice the speed.',
        'https://www.anthropic.com/news/claude-3-5-sonnet', '2024-06-20', 'major', 'Global', 1
      ],
      [
        'evt-007', 'gpt-4o', 'restriction',
        'OpenAI restricts API access for users located in China and other unsupported territories, enforcing strict geofencing policies.',
        'OpenAI is taking additional measures to block API traffic from regions where we do not support access to our services, effective July 9, 2024.',
        'https://help.openai.com/en/articles/9429188-supported-countries-and-territories', '2024-07-09', 'major', 'China', 1
      ],
      [
        'evt-008', 'gpt-3.5-turbo', 'deprecation',
        'OpenAI announces the deprecation plan for GPT-3.5-turbo, recommending that all developers transition to the newly launched GPT-4o-mini.',
        'With the release of GPT-4o-mini, we are deprecating GPT-3.5-turbo. Legacy API endpoints will remain functional for six months, after which they will turn off.',
        'https://openai.com/index/gpt-4o-mini-advancing-cost-efficient-intelligence/', '2024-07-18', 'major', 'Global', 1
      ],
      [
        'evt-009', 'gpt-4o-mini', 'launch',
        'OpenAI launches GPT-4o-mini, a cost-efficient small model designed to replace GPT-3.5, priced at 15 cents per million input tokens and 60 cents per million output tokens.',
        'We are launching GPT-4o-mini, our most cost-efficient small model. It is 60% cheaper than GPT-3.5-turbo, score 82% on MMLU, and is available today in API.',
        'https://openai.com/index/gpt-4o-mini-advancing-cost-efficient-intelligence/', '2024-07-18', 'major', 'Global', 1
      ],
      [
        'evt-010', 'llama-3-1-405b', 'launch',
        'Meta releases Llama 3.1 405B, the largest open-weights LLM in the industry, offering state-of-the-art synthetic data generation and model distillation capabilities.',
        'Today we are releasing Llama 3.1 405B, the first frontier-class open-weights model. It expands context to 128K, supports multilingual text, and matches top closed models.',
        'https://ai.meta.com/blog/meta-llama-3-1/', '2024-07-23', 'major', 'Global', 1
      ],
      [
        'evt-011', 'llama-3-1-70b', 'launch',
        'Meta launches Llama 3.1 70B alongside the 405B flagship, offering a smaller, highly efficient open weights option for coding, reasoning, and complex tasks.',
        'Llama 3.1 70B is now available. It features an upgraded 128k context length and is highly optimized for enterprise agentic architectures and coding assistance.',
        'https://ai.meta.com/blog/meta-llama-3-1/', '2024-07-23', 'minor', 'Global', 1
      ],
      [
        'evt-012', 'llama-3-1-405b', 'restriction',
        'Meta restricts the downloads of Llama 3.1 weights from residents of sanctioned jurisdictions and requires commercial licenses for organizations with >700M monthly users.',
        'Downloads of Llama 3.1 weights remain restricted under Meta License agreements in sanctioned countries. High scale commercial use requires explicit license approval.',
        'https://github.com/meta-llama/llama-models/blob/main/LICENSE', '2024-07-23', 'major', 'Sanctioned Nations', 1
      ],
      [
        'evt-013', 'mistral-large-2', 'launch',
        'Mistral AI launches Mistral Large 2, a 123B open-weights model, showing massive improvements in multilingual support, coding, reasoning, and mathematical abilities.',
        'Mistral Large 2 is our new flagship model. It offers 128k context, strong coding and math performance, and is available under the Mistral Research License.',
        'https://mistral.ai/news/mistral-large-2407/', '2024-07-24', 'major', 'Global', 1
      ],
      [
        'evt-014', 'gpt-4o', 'pricing_change',
        'OpenAI slashes API pricing for GPT-4o by 50% for input tokens and 33% for output tokens, alongside increasing rate limits.',
        'To support developer growth, we are reducing GPT-4o API input costs by 50% (now $2.50/M) and output costs by 33% (now $10.00/M), starting today.',
        'https://openai.com/index/gpt-4o-fine-tuning-and-api-updates/', '2024-08-06', 'minor', 'Global', 1
      ],
      [
        'evt-015', 'llama-3-1-70b', 'update',
        'Meta releases updated safety weights (Llama Guard 3) and safety filters for Llama 3.1 models to prevent jailbreaks and malicious outputs.',
        'We are updating our ecosystem safety tools, releasing Llama Guard 3 to support secure deployment of Llama 3.1 models across agentic tasks.',
        'https://ai.meta.com/blog/meta-llama-3-1-safety-updates/', '2024-08-15', 'minor', 'Global', 1
      ],
      [
        'evt-016', 'gemini-1-5-pro', 'update',
        'Google releases an experimental version of Gemini 1.5 Pro (0827), claiming the top spot on the LMSYS Chatbot Arena leaderboard.',
        'Our new experimental model, gemini-1-5-pro-0827, is now available in Google AI Studio. It features significant updates in coding, math, and instruction following.',
        'https://x.com/GoogleStartups/status/1828483756285747444', '2024-08-27', 'minor', 'Global', 1
      ],
      [
        'evt-017', 'claude-3-5-sonnet', 'update',
        'Anthropic updates Claude 3.5 Sonnet with a new "computer use" API, enabling the model to navigate screens, click buttons, and type text to automate workflows.',
        'Today we are announcing an upgraded Claude 3.5 Sonnet. It features major improvements in coding and introduces a groundbreaking capability: Computer Use.',
        'https://www.anthropic.com/news/3-5-models-and-computer-use', '2024-10-22', 'major', 'Global', 1
      ],
      [
        'evt-018', 'claude-3-5-sonnet', 'pricing_change',
        'Anthropic maintains Claude 3.5 Sonnet pricing but notes that Computer Use token usage will count extra actions as token overhead.',
        'While Claude 3.5 Sonnet pricing remains $3/M input and $15/M output, the new Computer Use API sends screenshots that increase input token counts.',
        'https://www.anthropic.com/pricing', '2024-10-22', 'minor', 'Global', 1
      ],
      [
        'evt-019', 'claude-3-opus', 'deprecation',
        'Anthropic plans to deprecate the legacy Claude 2.1 and Claude 2.0 API endpoints on November 1, urging customers to upgrade to the Claude 3 family.',
        'As of November 1, 2024, API endpoints for Claude 2.1 and Claude 2.0 will be deprecated. Developers are encouraged to migrate to Claude 3 Haiku or Sonnet.',
        'https://support.anthropic.com/en/articles/legacy-migrations', '2024-11-01', 'minor', 'Global', 1
      ],
      [
        'evt-020', 'codestral', 'update',
        'Mistral updates the license for Codestral, enabling developers to use it for internal commercial software development.',
        'We are updating the Codestral license to be more permissive. You can now use Codestral for commercial development work inside your organizations.',
        'https://mistral.ai/news/codestral-license-update/', '2024-12-16', 'minor', 'Global', 1
      ]
    ];

    for (const e of events) {
      await db.run(`
        INSERT INTO events (
          id, model_id, event_type, summary, raw_source_text, source_url, published_date, impact_score, region_affected, is_verified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, e);
    }

    // 4. Users
    const users = [
      ['usr-001', 'viewer@modelpulse.com', 'viewer'],
      ['usr-002', 'admin@modelpulse.com', 'admin']
    ];

    for (const u of users) {
      await db.run(`INSERT INTO users (id, email, role) VALUES (?, ?, ?)`, u);
    }

    // 5. Pending Articles (seed some articles to allow approval workflow demo)
    const pending = [
      [
        'art-001', 'OpenAI introduces canvas, a new interface for writing and coding', 'OpenAI Blog',
        'OpenAI is introducing canvas, a new interface for working with ChatGPT on writing and coding projects that goes beyond simple chat. Canvas opens in a separate window, allowing you and ChatGPT to collaborate on a project. Canvas is built with GPT-4o and can be manually selected in the model picker.',
        'https://openai.com/index/introducing-canvas/', '2024-10-03'
      ],
      [
        'art-002', 'Anthropic announces Claude 3.5 Haiku', 'Anthropic News',
        'We are excited to announce Claude 3.5 Haiku, our next-generation fast model. It matches the performance of Claude 3 Opus at the speed and cost of Claude 3 Haiku. Claude 3.5 Haiku will release in November on our API and chat interfaces.',
        'https://www.anthropic.com/news/claude-3-5-haiku', '2024-10-22'
      ],
      [
        'art-003', 'Google releases Gemini 1.5 Flash-8B', 'Google Developer News',
        'Gemini 1.5 Flash-8B is a smaller, faster version of Gemini 1.5 Flash. It is highly optimized for high-volume, low-latency tasks. It costs 50% less than Gemini 1.5 Flash and is available today via Gemini API.',
        'https://developers.googleblog.com/en/gemini-15-flash-8b/', '2024-10-03'
      ]
    ];

    for (const a of pending) {
      await db.run(`
        INSERT INTO pending_articles (id, title, source, article_text, source_url, published_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `, a);
    }

    console.log('Database seeded successfully.');
  } else {
    console.log('Database already has seeded data. Skipping seed.');
  }
}
