import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import productRoutes from './src/routes/products.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/products', productRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));