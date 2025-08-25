import { NextRequest } from 'next/server'
import { saveKnowledgeEntries } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const knowledgeEntries = await request.json()

    if (!Array.isArray(knowledgeEntries)) {
      return Response.json({ 
        error: 'Invalid data format. Expected array of knowledge entries.' 
      }, { status: 400 })
    }

    // Validate each entry has required fields
    for (const entry of knowledgeEntries) {
      if (!entry.service_name || !entry.category || !entry.description) {
        return Response.json({ 
          error: 'Missing required fields: service_name, category, and description are required.' 
        }, { status: 400 })
      }
    }

    // Add metadata
    const enrichedEntries = knowledgeEntries.map(entry => ({
      ...entry,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'admin', // In a real app, get from auth
      source: 'file_upload',
      status: 'active'
    }))

    // Save to MongoDB
    const result = await saveKnowledgeEntries(enrichedEntries)

    return Response.json({
      success: true,
      message: `Successfully saved ${knowledgeEntries.length} knowledge entries`,
      insertedIds: result,
      count: knowledgeEntries.length
    })

  } catch (error) {
    console.error('Error saving knowledge entries:', error)
    return Response.json({
      error: 'Failed to save knowledge entries',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
