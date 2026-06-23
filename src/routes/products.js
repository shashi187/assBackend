import express from 'express';
import pool from '../db.js';

const router = express.Router();
// GET /api/products?limit=20&cursor=<timestamp>_<id>&category=Electronics
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const category = req.query.category || null;
    const cursor = req.query.cursor || null; // format: "ISO_DATE_id"

    let cursorDate = null;
    let cursorId = null;

    if (cursor) {
      // cursor format: "2024-01-15T10:30:00.000Z_1523"
      const lastUnderscoreIndex = cursor.lastIndexOf('_');
      cursorDate = cursor.substring(0, lastUnderscoreIndex);
      cursorId = parseInt(cursor.substring(lastUnderscoreIndex + 1));

      if (!cursorDate || isNaN(cursorId)) {
        return res.status(400).json({ error: 'Invalid cursor format' });
      }
    }

    const params = [];
    let paramIndex = 1;

    // Build the WHERE clause
    const conditions = [];

    if (cursor) {
      conditions.push(
        `(created_at < $${paramIndex} OR (created_at = $${paramIndex} AND id < $${paramIndex + 1}))`
      );
      params.push(cursorDate, cursorId);
      paramIndex += 2;
    }

    if (category) {
      conditions.push(`category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 
      ? 'WHERE ' + conditions.join(' AND ') 
      : '';

    params.push(limit + 1); // fetch one extra to check if there's a next page

    const query = `
      SELECT id, name, category, price, created_at, updated_at
      FROM products
      ${whereClause}
      ORDER BY created_at DESC, id DESC
      LIMIT $${paramIndex}
    `;

    const result = await pool.query(query, params);
    const rows = result.rows;

    const hasNextPage = rows.length > limit;
    const data = hasNextPage ? rows.slice(0, limit) : rows;

    // Build the next cursor from the last item returned
    let nextCursor = null;
    if (hasNextPage) {
      const last = data[data.length - 1];
      nextCursor = `${last.created_at.toISOString()}_${last.id}`;
    }

    res.json({
      data,
      nextCursor,
      hasNextPage
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/products/categories — for populating filter dropdown
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT category FROM products ORDER BY category'
    );
    res.json(result.rows.map(r => r.category));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
export default router;