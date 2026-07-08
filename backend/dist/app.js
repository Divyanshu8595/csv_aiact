"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const multer_1 = require("./config/multer");
const importController_1 = require("./controllers/importController");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Enable CORS for frontend communications
app.use((0, cors_1.default)({
    origin: '*', // Allow all origins for the sake of the assignment, can be tightened for production
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'GrowEasy CSV Importer Backend'
    });
});
// Import route
app.post('/api/import', multer_1.upload.single('file'), importController_1.importCsv);
// Global Error Handler for Multer or other middleware issues
app.use((err, req, res, next) => {
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
exports.default = app;
