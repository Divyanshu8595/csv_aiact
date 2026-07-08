import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { upload } from './config/multer';
import { importCsv } from './controllers/importController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend communications
app.use(cors({
  origin: '*', // Allow all origins for the sake of the assignment, can be tightened for production
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'GrowEasy CSV Importer Backend'
  });
});

// Import route
app.post('/api/import', upload.single('file'), importCsv);

// Global Error Handler for Multer or other middleware issues
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Express Global Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected error occurred on the server.'
  });
});

app.listen(PORT, () => {
  console.log(`[Server] Server is running on port ${PORT}`);
  console.log(`[Server] Health check available at http://localhost:${PORT}/api/health`);
});

export default app;
