import { MongoClient, Db, Collection } from 'mongodb'

let client: MongoClient
let db: Db

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const dbName = process.env.MONGODB_DB_NAME || 'municipal_services'

export async function connectToDatabase(): Promise<{ 
  db: Db, 
  complaintsCollection: Collection, 
  usersCollection: Collection, 
  phoneVerificationCollection: Collection,
  knowledgeBaseCollection: Collection,
  complaintTypesCollection: Collection
}> {
  if (!client) {
    client = new MongoClient(uri)
    await client.connect()
    console.log('Connected to MongoDB')
  }
  
  if (!db) {
    db = client.db(dbName)
  }
  
  const complaintsCollection = db.collection('complaints')
  const usersCollection = db.collection('users')
  const phoneVerificationCollection = db.collection('phone_verifications')
  const knowledgeBaseCollection = db.collection('knowledge_base')
  const complaintTypesCollection = db.collection('complaint_types')
  
  return { 
    db, 
    complaintsCollection, 
    usersCollection, 
    phoneVerificationCollection,
    knowledgeBaseCollection,
    complaintTypesCollection
  }
}

export async function saveComplaintToMongoDB(complaintData: any): Promise<string> {
  try {
    const { complaintsCollection } = await connectToDatabase()
    
    const result = await complaintsCollection.insertOne({
      ...complaintData,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    return result.insertedId.toString()
  } catch (error) {
    console.error('Error saving complaint to MongoDB:', error)
    throw error
  }
}

export async function getComplaintById(reportId: string) {
  try {
    const { complaintsCollection } = await connectToDatabase()
    return await complaintsCollection.findOne({ reportId })
  } catch (error) {
    console.error('Error fetching complaint from MongoDB:', error)
    throw error
  }
}

export async function getAllComplaints() {
  try {
    const { complaintsCollection } = await connectToDatabase()
    return await complaintsCollection.find({}).sort({ createdAt: -1 }).toArray()
  } catch (error) {
    console.error('Error fetching complaints from MongoDB:', error)
    throw error
  }
}

export async function getComplaintsByUserId(userId: string) {
  try {
    const { complaintsCollection } = await connectToDatabase()
    return await complaintsCollection.find({ userId }).sort({ createdAt: -1 }).toArray()
  } catch (error) {
    console.error('Error fetching user complaints from MongoDB:', error)
    throw error
  }
}

export async function updateComplaintStatus(reportId: string, updateData: any) {
  try {
    const { complaintsCollection } = await connectToDatabase()
    
    const result = await complaintsCollection.updateOne(
      { reportId },
      { $set: { ...updateData, updatedAt: new Date() } }
    )
    
    if (result.matchedCount === 0) {
      throw new Error('Complaint not found')
    }
    
    // Fetch and return the updated document
    const updatedDocument = await complaintsCollection.findOne({ reportId })
    return updatedDocument
  } catch (error) {
    console.error('Error updating complaint status:', error)
    throw error
  }
}

// Phone verification functions
export async function savePhoneVerification(phoneData: any): Promise<string> {
  try {
    const { phoneVerificationCollection } = await connectToDatabase()
    
    const result = await phoneVerificationCollection.insertOne({
      ...phoneData,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    return result.insertedId.toString()
  } catch (error) {
    console.error('Error saving phone verification to MongoDB:', error)
    throw error
  }
}

export async function getPhoneVerificationByUserId(userId: string) {
  try {
    const { phoneVerificationCollection } = await connectToDatabase()
    return await phoneVerificationCollection.findOne({ userId })
  } catch (error) {
    console.error('Error fetching phone verification from MongoDB:', error)
    throw error
  }
}

export async function updatePhoneVerificationStatus(userId: string, isVerified: boolean, verifiedAt?: Date) {
  try {
    const { phoneVerificationCollection } = await connectToDatabase()
    return await phoneVerificationCollection.updateOne(
      { userId },
      { 
        $set: { 
          isVerified,
          verifiedAt: verifiedAt || new Date(),
          updatedAt: new Date() 
        } 
      }
    )
  } catch (error) {
    console.error('Error updating phone verification status:', error)
    throw error
  }
}

// User management functions
export async function saveUserData(userData: any): Promise<string> {
  try {
    const { usersCollection } = await connectToDatabase()
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ 
      $or: [
        { email: userData.email },
        { uid: userData.uid }
      ]
    })
    
    if (existingUser) {
      // Update existing user
      await usersCollection.updateOne(
        { _id: existingUser._id },
        { 
          $set: { 
            ...userData,
            updatedAt: new Date()
          }
        }
      )
      return existingUser._id.toString()
    } else {
      // Create new user
      const result = await usersCollection.insertOne({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      return result.insertedId.toString()
    }
  } catch (error) {
    console.error('Error saving user data to MongoDB:', error)
    throw error
  }
}

// Knowledge Base Functions
export async function saveKnowledgeBase(knowledgeData: any): Promise<string> {
  try {
    const { knowledgeBaseCollection } = await connectToDatabase()
    
    // Check if knowledge base already exists
    const existingKB = await knowledgeBaseCollection.findOne({ type: 'services' })
    
    if (existingKB) {
      // Update existing knowledge base
      await knowledgeBaseCollection.updateOne(
        { type: 'services' },
        { 
          $set: { 
            ...knowledgeData,
            updatedAt: new Date()
          }
        }
      )
      return existingKB._id.toString()
    } else {
      // Create new knowledge base entry
      const result = await knowledgeBaseCollection.insertOne({
        type: 'services',
        ...knowledgeData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      return result.insertedId.toString()
    }
  } catch (error) {
    console.error('Error saving knowledge base to MongoDB:', error)
    throw error
  }
}

// New function to save individual knowledge entries from file uploads
export async function saveKnowledgeEntries(knowledgeEntries: any[]): Promise<string[]> {
  try {
    const { knowledgeBaseCollection } = await connectToDatabase()
    
    // Prepare entries for insertion
    const preparedEntries = knowledgeEntries.map(entry => ({
      ...entry,
      type: 'individual_service',
      createdAt: new Date(),
      updatedAt: new Date()
    }))
    
    // Insert all entries
    const result = await knowledgeBaseCollection.insertMany(preparedEntries)
    return Object.values(result.insertedIds).map(id => id.toString())
  } catch (error) {
    console.error('Error saving knowledge entries to MongoDB:', error)
    throw error
  }
}

export async function saveComplaintTypes(complaintTypesData: any): Promise<string> {
  try {
    const { complaintTypesCollection } = await connectToDatabase()
    
    // Check if complaint types already exist
    const existingTypes = await complaintTypesCollection.findOne({ type: 'complaint_types' })
    
    if (existingTypes) {
      // Update existing complaint types
      await complaintTypesCollection.updateOne(
        { type: 'complaint_types' },
        { 
          $set: { 
            ...complaintTypesData,
            updatedAt: new Date()
          }
        }
      )
      return existingTypes._id.toString()
    } else {
      // Create new complaint types entry
      const result = await complaintTypesCollection.insertOne({
        type: 'complaint_types',
        ...complaintTypesData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      return result.insertedId.toString()
    }
  } catch (error) {
    console.error('Error saving complaint types to MongoDB:', error)
    throw error
  }
}

export async function saveComplaintProcess(processData: any): Promise<string> {
  try {
    const { knowledgeBaseCollection } = await connectToDatabase()
    
    // Check if complaint process already exists
    const existingProcess = await knowledgeBaseCollection.findOne({ type: 'complaint_process' })
    
    if (existingProcess) {
      // Update existing complaint process
      await knowledgeBaseCollection.updateOne(
        { type: 'complaint_process' },
        { 
          $set: { 
            ...processData,
            updatedAt: new Date()
          }
        }
      )
      return existingProcess._id.toString()
    } else {
      // Create new complaint process entry
      const result = await knowledgeBaseCollection.insertOne({
        type: 'complaint_process',
        ...processData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      return result.insertedId.toString()
    }
  } catch (error) {
    console.error('Error saving complaint process to MongoDB:', error)
    throw error
  }
}

export async function getKnowledgeBase(): Promise<any> {
  try {
    const { knowledgeBaseCollection } = await connectToDatabase()
    
    // Get the main knowledge base
    const mainKB = await knowledgeBaseCollection.findOne({ type: 'services' })
    
    // Get individual services added through uploads
    const individualServices = await knowledgeBaseCollection.find({ 
      type: 'individual_service' 
    }).toArray()
    
    // Combine both sources
    if (mainKB && mainKB.services) {
      // If main KB exists, combine with individual services
      return {
        ...mainKB,
        services: [...mainKB.services, ...individualServices]
      }
    } else if (individualServices.length > 0) {
      // If only individual services exist
      return individualServices
    } else {
      // Return main KB as is (or null)
      return mainKB
    }
  } catch (error) {
    console.error('Error fetching knowledge base from MongoDB:', error)
    throw error
  }
}

export async function getComplaintTypes(): Promise<any> {
  try {
    const { complaintTypesCollection } = await connectToDatabase()
    return await complaintTypesCollection.findOne({ type: 'complaint_types' })
  } catch (error) {
    console.error('Error fetching complaint types from MongoDB:', error)
    throw error
  }
}

export async function getComplaintProcess(): Promise<any> {
  try {
    const { knowledgeBaseCollection } = await connectToDatabase()
    return await knowledgeBaseCollection.findOne({ type: 'complaint_process' })
  } catch (error) {
    console.error('Error fetching complaint process from MongoDB:', error)
    throw error
  }
}

export async function searchKnowledgeBase(query: string): Promise<any[]> {
  try {
    const { knowledgeBaseCollection } = await connectToDatabase()
    
    // Create text index if it doesn't exist
    await knowledgeBaseCollection.createIndex({ 
      "services.service_name": "text", 
      "services.tag": "text", 
      "services.procedure": "text" 
    })
    
    const results = await knowledgeBaseCollection.find({
      $text: { $search: query }
    }).toArray()
    
    return results
  } catch (error) {
    console.error('Error searching knowledge base:', error)
    throw error
  }
}
