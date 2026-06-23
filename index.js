import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import productRoutes from './src/routes/products.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();  //  create app

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));  // ← then use it

app.use('/api/products', productRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));