import { getAllComplaints, getComplaintById, getComplaintsByUserId } from '@/lib/mongodb'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('reportId')
    const userId = searchParams.get('userId')
    
    if (reportId) {
      // Get specific complaint by ID
      const complaint = await getComplaintById(reportId)
      if (!complaint) {
        return Response.json({ error: 'Complaint not found' }, { status: 404 })
      }
      return Response.json({ complaint })
    } else if (userId) {
      // Get complaints for specific user
      const complaints = await getComplaintsByUserId(userId)
      return Response.json({ success: true, complaints: complaints || [] })
    } else {
      // Get all complaints
      const complaints = await getAllComplaints()
      return Response.json({ complaints, count: complaints.length })
    }
  } catch (error) {
    console.error('Error fetching complaints:', error)
    return Response.json({ error: 'Failed to fetch complaints' }, { status: 500 })
  }
}
