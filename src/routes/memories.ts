import { Router, Response } from 'express';
import { AuthRequest, getUserId } from '../middleware/auth';
import { memoryService } from '../services/memoryService';
import { MemoryCreateInput } from '../types';

const router = Router();

/**
 * Create a new memory
 * POST /api/memories
 */
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const userId = getUserId(req);
        const input: MemoryCreateInput = req.body;

        const result = await memoryService.createMemory(userId, input);

        res.status(201).json(result);
    } catch (error: any) {
        console.error('Error creating memory:', error);
        res.status(500).json({ error: error.message || 'Failed to create memory' });
    }
});

/**
 * Get all memories
 * GET /api/memories?limit=50&offset=0&type=note
 */
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const userId = getUserId(req);
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;
        const type = req.query.type as string | undefined;

        const result = await memoryService.getMemories(userId, { limit, offset, type });

        res.json(result);
    } catch (error: any) {
        console.error('Error fetching memories:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch memories' });
    }
});

/**
 * Get single memory by ID
 * GET /api/memories/:id
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const userId = getUserId(req);
        const memoryId = req.params.id as string;

        const memory = await memoryService.getMemory(memoryId, userId);

        if (!memory) {
            return res.status(404).json({ error: 'Memory not found' });
        }

        res.json({ memory });
    } catch (error: any) {
        console.error('Error fetching memory:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch memory' });
    }
});

/**
 * Update memory
 * PATCH /api/memories/:id
 */
router.patch('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const userId = getUserId(req);
        const memoryId = req.params.id as string;
        const updates = req.body;

        const memory = await memoryService.updateMemory(memoryId, userId, updates);

        res.json({ memory });
    } catch (error: any) {
        console.error('Error updating memory:', error);
        res.status(500).json({ error: error.message || 'Failed to update memory' });
    }
});

/**
 * Delete memory
 * DELETE /api/memories/:id
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const userId = getUserId(req);
        const memoryId = req.params.id as string;

        await memoryService.deleteMemory(memoryId, userId);

        res.status(204).send();
    } catch (error: any) {
        console.error('Error deleting memory:', error);
        res.status(500).json({ error: error.message || 'Failed to delete memory' });
    }
});

export default router;
