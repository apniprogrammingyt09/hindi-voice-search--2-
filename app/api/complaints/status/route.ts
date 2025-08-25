import { updateComplaintStatus } from '@/lib/mongodb'
import { NextRequest } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { reportId, status, adminId, adminEmail, reason } = body

    if (!reportId || !status) {
      return Response.json({ error: 'Report ID and status are required' }, { status: 400 })
    }

    // Valid status values
    const validStatuses = ['Pending Approval', 'Approved', 'Rejected', 'In Progress', 'Completed', 'Closed']
    if (!validStatuses.includes(status)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updateData: any = {
      status,
      lastUpdatedBy: {
        adminId,
        adminEmail,
        timestamp: new Date().toISOString()
      }
    }

    // Add reason for rejection
    if (status === 'Rejected' && reason) {
      updateData.rejectionReason = reason
    }

    const result = await updateComplaintStatus(reportId, updateData)
    
    if (!result) {
      return Response.json({ error: 'Failed to update complaint status' }, { status: 500 })
    }

    return Response.json({ 
      success: true, 
      message: `Complaint ${status.toLowerCase()} successfully`,
      complaint: result 
    })
  } catch (error) {
    console.error('Error updating complaint status:', error)
    return Response.json({ error: 'Failed to update complaint status' }, { status: 500 })
  }
}
