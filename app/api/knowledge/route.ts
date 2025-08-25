import { NextRequest } from 'next/server'
import { getKnowledgeBase, getComplaintTypes, getComplaintProcess, searchKnowledgeBase } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const query = searchParams.get('query')

    // If search query is provided, perform search
    if (query) {
      const searchResults = await searchKnowledgeBase(query)
      return Response.json({ 
        success: true, 
        results: searchResults 
      })
    }

    // Return specific type or all knowledge base data
    switch (type) {
      case 'services':
        const knowledgeBase = await getKnowledgeBase()
        return Response.json({ 
          success: true, 
          data: knowledgeBase 
        })
      
      case 'complaint_types':
        const complaintTypes = await getComplaintTypes()
        return Response.json({ 
          success: true, 
          data: complaintTypes 
        })
      
      case 'complaint_process':
        const complaintProcess = await getComplaintProcess()
        return Response.json({ 
          success: true, 
          data: complaintProcess 
        })
      
      default:
        // Return all knowledge base data
        const [kb, ct, cp] = await Promise.all([
          getKnowledgeBase(),
          getComplaintTypes(),
          getComplaintProcess()
        ])
        
        return Response.json({ 
          success: true, 
          data: {
            services: kb,
            complaint_types: ct,
            complaint_process: cp
          }
        })
    }
  } catch (error) {
    console.error('Error fetching knowledge base:', error)
    return Response.json({ 
      error: 'Failed to fetch knowledge base',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
