import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { authenticateUser } from './middleware/auth';
import memoriesRouter from './routes/memories';
import searchRouter from './routes/search';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: config.server.allowedOrigins,
    credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests from this IP',
});
app.use('/api/', limiter);

// Body parser
app.use(express.json());

// Health check (no auth required)
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});

// API routes (all require authentication)
app.use('/api/memories', authenticateUser, memoriesRouter);
app.use('/api/search', authenticateUser, searchRouter);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
    console.log(`🚀 OpenClaw server running on port ${PORT}`);
    console.log(`📍 Environment: ${config.server.nodeEnv}`);
    console.log(`🔒 CORS enabled for: ${config.server.allowedOrigins.join(', ')}`);
});

export default app;
