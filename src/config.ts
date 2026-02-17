import dotenv from 'dotenv';

dotenv.config();

export const config = {
    // Gemini AI
    gemini: {
        apiKey: process.env.GEMINI_API_KEY || '',
    },

    // Pinecone Vector DB
    pinecone: {
        apiKey: process.env.PINECONE_API_KEY || '',
        environment: process.env.PINECONE_ENVIRONMENT || 'us-east-1',
        indexName: process.env.PINECONE_INDEX_NAME || 'cortex-memories',
    },

    // Clerk Authentication
    clerk: {
        secretKey: process.env.CLERK_SECRET_KEY || '',
    },

    // Database
    database: {
        url: process.env.DATABASE_URL || '',
    },

    // Server
    server: {
        port: parseInt(process.env.PORT || '8000'),
        nodeEnv: process.env.NODE_ENV || 'development',
        allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
    },
};

// Validate required environment variables
const requiredEnvVars = [
    'GEMINI_API_KEY',
    'PINECONE_API_KEY',
    'CLERK_SECRET_KEY',
    'DATABASE_URL',
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.warn(`⚠️  Warning: ${envVar} is not set`);
    }
}
