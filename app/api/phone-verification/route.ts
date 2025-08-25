import { savePhoneVerification, getPhoneVerificationByUserId, updatePhoneVerificationStatus } from '@/lib/mongodb'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { action, userId, phoneNumber, verificationCode, isVerified } = await request.json()
    
    switch (action) {
      case 'save_verification':
        // Save new phone verification entry
        const verificationData = {
          userId,
          phoneNumber,
          verificationCode,
          isVerified: false,
          attemptsCount: 1
        }
        
        const mongoId = await savePhoneVerification(verificationData)
        return Response.json({ 
          success: true, 
          mongoId,
          message: 'Phone verification data saved' 
        })
        
      case 'update_status':
        // Update verification status
        await updatePhoneVerificationStatus(userId, isVerified, new Date())
        return Response.json({ 
          success: true, 
          message: 'Verification status updated' 
        })
        
      case 'get_verification':
        // Get verification data
        const verification = await getPhoneVerificationByUserId(userId)
        return Response.json({ 
          success: true, 
          verification 
        })
        
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in phone verification API:', error)
    return Response.json({ error: 'Phone verification operation failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    const verification = await getPhoneVerificationByUserId(userId)
    return Response.json({ 
      success: true, 
      verification 
    })
  } catch (error) {
    console.error('Error fetching phone verification:', error)
    return Response.json({ error: 'Failed to fetch phone verification' }, { status: 500 })
  }
}
