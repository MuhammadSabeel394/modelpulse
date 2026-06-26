import { db, initializeDatabase } from './db.js';

async function testDatabase() {
  console.log('--- Starting Database Adapter and Seeding Verification ---');
  try {
    // 1. Initialize DB and run migrations + seeding
    await initializeDatabase();
    console.log('✓ Database initialization ran.');

    // 2. Query providers
    const providers = await db.all('SELECT * FROM providers');
    console.log(`✓ Providers loaded: ${providers.length} records. (Expected: 5)`);
    if (providers.length !== 5) {
      throw new Error(`Invalid provider count: ${providers.length}`);
    }

    // 3. Query models
    const models = await db.all('SELECT * FROM models');
    console.log(`✓ Models loaded: ${models.length} records. (Expected: 13)`);
    if (models.length !== 13) {
      throw new Error(`Invalid model count: ${models.length}`);
    }

    // 4. Query events
    const events = await db.all('SELECT * FROM events');
    console.log(`✓ Events loaded: ${events.length} records. (Expected: 20)`);
    if (events.length !== 20) {
      throw new Error(`Invalid events count: ${events.length}`);
    }

    // 5. Test joins
    const joins = await db.all(`
      SELECT e.*, m.name as model_name, p.name as provider_name
      FROM events e
      JOIN models m ON e.model_id = m.id
      JOIN providers p ON m.provider_id = p.id
      LIMIT 1
    `);
    console.log('✓ Joint queries work correctly. Test event joined info:', {
      id: joins[0].id,
      model_name: joins[0].model_name,
      provider_name: joins[0].provider_name,
      event_type: joins[0].event_type,
      summary: joins[0].summary.substring(0, 50) + '...'
    });

    console.log('✓ Verification successful: Database operates correctly.');
    process.exit(0);
  } catch (err) {
    console.error('✗ Verification failed with error:', err);
    process.exit(1);
  }
}

testDatabase();
