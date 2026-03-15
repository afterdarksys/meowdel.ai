import { NextResponse } from 'next/server'
// Import the pipeline from transformers.js
// We use a relatively small feature extraction model compatible with browsers and Serverless functions
let pipeline: any;
let getEmbeddingsPipeline = async () => {
    if (!pipeline) {
        const { pipeline: initPipeline } = await import('@xenova/transformers');
        pipeline = await initPipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
            quantized: true, // Keep it fast and light
        });
    }
    return pipeline;
}

// Helper to compute cosine similarity
function cosineSimilarity(vecA: number[], vecB: number[]) {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function POST(request: Request) {
    try {
        const { query, notes } = await request.json()
        
        if (!query || !notes || !Array.isArray(notes)) {
             return NextResponse.json({ error: 'Query and notes payload required' }, { status: 400 })
        }

        const extractor = await getEmbeddingsPipeline()

        // 1. Generate embedding for the query string
        const queryOutput = await extractor(query, { pooling: 'mean', normalize: true })
        const queryEmbedding = Array.from(queryOutput.data) as number[]

        // 2. Generate embeddings for all notes (in a real app, these would be cached/pre-computed)
        const scoredNotes = await Promise.all(notes.map(async (note) => {
             // We'll embed the title and a snippet of content to save time
             const textToEmbed = `${note.title}\n\n${note.excerpt}`
             const noteOutput = await extractor(textToEmbed, { pooling: 'mean', normalize: true })
             const noteEmbedding = Array.from(noteOutput.data) as number[]

             const score = cosineSimilarity(queryEmbedding, noteEmbedding)
             return {
                 ...note,
                 score
             }
        }))

        // Sort by highest similarity first
        scoredNotes.sort((a, b) => b.score - a.score)
        
        // Return top 5
        return NextResponse.json(scoredNotes.slice(0, 5))

    } catch (error) {
        console.error('Search error:', error)
        return NextResponse.json({ error: 'Failed to perform semantic search' }, { status: 500 })
    }
}
