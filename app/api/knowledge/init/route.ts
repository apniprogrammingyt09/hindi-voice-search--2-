import { NextRequest } from 'next/server'
import { saveKnowledgeBase, saveComplaintTypes, saveComplaintProcess } from '@/lib/mongodb'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const knowledgeBasePath = path.join(process.cwd(), 'public', 'knowledge', 'knowlwdge.json')
    const complaintTypesPath = path.join(process.cwd(), 'public', 'knowledge', 'compiant.json')
    const complaintProcessPath = path.join(process.cwd(), 'public', 'knowledge', 'compaintprcoess.json')

    // Read knowledge base files
    const knowledgeBaseData = JSON.parse(fs.readFileSync(knowledgeBasePath, 'utf8'))
    const complaintTypesData = JSON.parse(fs.readFileSync(complaintTypesPath, 'utf8'))
    const complaintProcessData = JSON.parse(fs.readFileSync(complaintProcessPath, 'utf8'))

    // Save to MongoDB
    const kbId = await saveKnowledgeBase(knowledgeBaseData)
    const ctId = await saveComplaintTypes(complaintTypesData)
    const cpId = await saveComplaintProcess(complaintProcessData)

    return Response.json({ 
      success: true, 
      message: 'Knowledge base initialized successfully',
      ids: {
        knowledgeBase: kbId,
        complaintTypes: ctId,
        complaintProcess: cpId
      }
    })
  } catch (error) {
    console.error('Error initializing knowledge base:', error)
    return Response.json({ 
      error: 'Failed to initialize knowledge base',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return Response.json({ 
    message: 'Use POST to initialize knowledge base from JSON files' 
  })
}
