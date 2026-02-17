export interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
}

export interface MemoryCreateInput {
    type: 'note' | 'task' | 'checklist' | 'reminder';
    title?: string;
    content: string;
    tags?: string[];
    items?: ChecklistItem[];
    reminderAt?: number;
    generateEmbedding?: boolean;
}

export interface MemoryResponse {
    id: string;
    userId: string;
    type: string;
    title?: string;
    content: string;
    tags: string[];
    autoTopics: string[];
    items?: ChecklistItem[];
    embeddingId?: string;
    linkedMemoryIds: string[];
    timestamp: number;
    reminderAt?: number;
    isPinned: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface SearchRequest {
    query: string;
    searchType?: 'semantic' | 'text' | 'hybrid';
    limit?: number;
    filters?: {
        type?: string;
        tags?: string[];
        dateRange?: {
            start: string;
            end: string;
        };
    };
}

export interface SearchResult {
    memory: MemoryResponse;
    score: number;
    matchType: 'semantic' | 'text' | 'hybrid';
}

export interface SearchResponse {
    results: SearchResult[];
    total: number;
    tookMs: number;
}

export interface GraphNode {
    id: string;
    label: string;
    type: string;
    tags: string[];
    timestamp: number;
}

export interface GraphEdge {
    source: string;
    target: string;
    weight: number;
    type: 'semantic' | 'manual' | 'tag-based';
}

export interface GraphResponse {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

export interface VectorMetadata {
    memoryId: string;
    userId: string;
    type: string;
    tags: string[];
    timestamp: number;
}
