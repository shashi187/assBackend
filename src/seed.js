import dotenv from "dotenv";
import pool from "./db.js";
dotenv.config();

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Food', 'Sports', 
                    'Toys', 'Home', 'Beauty', 'Automotive', 'Garden'];

const randomBetween = (min, max) => Math.random() * (max - min) + min;

async function seed() {
  const client = await pool.connect();

  try {
    console.log('Creating table...');

    // Create table + indexes
    await client.query(`
      DROP TABLE IF EXISTS products;

      CREATE TABLE products (
        id         SERIAL PRIMARY KEY,
        name       TEXT NOT NULL,
        category   TEXT NOT NULL,
        price      NUMERIC(10, 2) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_products_created_at_id 
        ON products (created_at DESC, id DESC);

      CREATE INDEX idx_products_category_created_at_id 
        ON products (category, created_at DESC, id DESC);
    `);

    console.log('Seeding 200,000 products...');

    const BATCH_SIZE = 10000;
    const TOTAL = 200000;

    for (let batch = 0; batch < TOTAL / BATCH_SIZE; batch++) {
      const values = [];
      const params = [];

      for (let i = 0; i < BATCH_SIZE; i++) {
        const index = batch * BATCH_SIZE + i;
        const category = CATEGORIES[index % CATEGORIES.length];
        const price = randomBetween(1, 10000).toFixed(2);
        // Spread created_at over last 2 years so data feels real
        const created_at = new Date(
          Date.now() - Math.random() * 2 * 365 * 24 * 60 * 60 * 1000
        ).toISOString();

        const base = i * 4;
        values.push(`($${base+1}, $${base+2}, $${base+3}, $${base+4}, $${base+4})`);
        params.push(`Product ${index + 1}`, category, price, created_at);
      }

      await client.query(
        `INSERT INTO products (name, category, price, created_at, updated_at)
         VALUES ${values.join(',')}`,
        params
      );

      console.log(`Inserted batch ${batch + 1}/${TOTAL / BATCH_SIZE}`);
    }

    console.log('✅ Done! 200,000 products seeded.');
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();