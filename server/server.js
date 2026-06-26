import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db, initializeDatabase } from './db.js';
import { classifyAndSummarize } from './nlp.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Initialize Database on Startup
initializeDatabase()
  .then(() => {
    console.log('Database initialized successfully.');
  })
  .catch((err) => {
    console.error('Database initialization failed:', err);
  });

// REST API Endpoints

// 1. Get all events (with optional filtering)
app.get('/api/events', async (req, res) => {
  try {
    const query = `
      SELECT e.*, m.name as model_name, m.provider_id, p.name as provider_name, p.logo_url as provider_logo_url
      FROM events e
      JOIN models m ON e.model_id = m.id
      JOIN providers p ON m.provider_id = p.id
    `;
    const events = await db.all(query);
    res.json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// 2. Get all models
app.get('/api/models', async (req, res) => {
  try {
    const query = `
      SELECT m.*, p.name as provider_name, p.logo_url as provider_logo_url
      FROM models m
      JOIN providers p ON m.provider_id = p.id
    `;
    const models = await db.all(query);
    res.json(models);
  } catch (err) {
    console.error('Error fetching models:', err);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

// 3. Get all providers
app.get('/api/providers', async (req, res) => {
  try {
    const providers = await db.all('SELECT * FROM providers');
    res.json(providers);
  } catch (err) {
    console.error('Error fetching providers:', err);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

// 4. Get pending articles (for the admin panel)
app.get('/api/pending', async (req, res) => {
  try {
    const pending = await db.all('SELECT * FROM pending_articles');
    res.json(pending);
  } catch (err) {
    console.error('Error fetching pending articles:', err);
    res.status(500).json({ error: 'Failed to fetch pending articles' });
  }
});

// 5. Update/Approve an event (Manual Override & Admin Approval)
app.post('/api/events/approve', async (req, res) => {
  const { eventId, articleId, modelId, eventType, summary, impactScore, regionAffected, sourceUrl, publishedDate } = req.body;
  
  if (!modelId || !eventType || !summary) {
    return res.status(400).json({ error: 'Missing required approval fields' });
  }

  const generatedEventId = eventId || `evt-${Date.now()}`;

  try {
    // 1. Insert/Replace in events table (marked as verified since it is approved by admin)
    await db.run(`
      INSERT OR REPLACE INTO events (
        id, model_id, event_type, summary, raw_source_text, source_url, published_date, impact_score, region_affected, is_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      generatedEventId,
      modelId,
      eventType,
      summary,
      'Approved via Admin Dashboard manual override.',
      sourceUrl || '',
      publishedDate || new Date().toISOString().split('T')[0],
      impactScore || 'minor',
      regionAffected || 'Global'
    ]);

    // 2. If it is from a pending article, delete it from pending_articles
    if (articleId) {
      await db.run(`DELETE FROM pending_articles WHERE id = ?`, [articleId]);
    }

    res.json({ success: true, message: 'Event successfully approved and published', eventId: generatedEventId });
  } catch (err) {
    console.error('Error approving event:', err);
    res.status(500).json({ error: 'Failed to approve and publish event' });
  }
});

// 6. Delete pending article
app.delete('/api/pending/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM pending_articles WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Pending article dismissed' });
  } catch (err) {
    console.error('Error deleting pending article:', err);
    res.status(500).json({ error: 'Failed to delete pending article' });
  }
});

// 7. Simulated authentication login gate (for Admin role)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Simulated credentials: admin@modelpulse.com / admin123
  if (email === 'admin@modelpulse.com' && password === 'admin123') {
    return res.json({
      token: 'mock-jwt-admin-token',
      user: {
        id: 'usr-002',
        email: 'admin@modelpulse.com',
        role: 'admin'
      }
    });
  } else if (email === 'viewer@modelpulse.com' && password === 'viewer123') {
    return res.json({
      token: 'mock-jwt-viewer-token',
      user: {
        id: 'usr-001',
        email: 'viewer@modelpulse.com',
        role: 'viewer'
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials. Hint: use admin@modelpulse.com / admin123' });
  }
});

// 8. Local NLP Classification Test Endpoint
app.post('/api/nlp/classify', async (req, res) => {
  const { title, text } = req.body;
  if (!title || !text) {
    return res.status(400).json({ error: 'Missing title or text parameter' });
  }
  try {
    const result = await classifyAndSummarize(title, text);
    res.json(result);
  } catch (err) {
    console.error('NLP API Error:', err);
    res.status(500).json({ error: 'NLP classification failed' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`ModelPulse Express backend listening at http://localhost:${PORT}`);
});
