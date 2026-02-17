import { Router, Response } from 'express';
import { AuthRequest, getUserId } from '../middleware/auth';
import { searchService } from '../services/searchService';
import { SearchRequest } from '../types';

const router = Router();

/**
 * Search memories
 * POST /api/search
 */
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const userId = getUserId(req);
        const searchRequest: SearchRequest = req.body;

        const results = await searchService.search(userId, searchRequest);

        res.json(results);
    } catch (error: any) {
        console.error('Error searching memories:', error);
        res.status(500).json({ error: error.message || 'Search failed' });
    }
});

export default router;
