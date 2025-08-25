import { NextRequest } from 'next/server'
import { writeFile, readFile, unlink } from 'fs/promises'
import { join } from 'path'

// Install required packages: npm install pdf-parse mammoth

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return Response.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ]

    if (!allowedTypes.includes(file.type)) {
      return Response.json({ 
        error: 'Invalid file type. Only PDF and DOCX files are allowed.' 
      }, { status: 400 })
    }

    // Save file temporarily
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const tempDir = join(process.cwd(), 'temp')
    const filePath = join(tempDir, `upload_${Date.now()}_${file.name}`)

    // Create temp directory if it doesn't exist
    try {
      await writeFile(filePath, buffer)
    } catch (error) {
      // If temp directory doesn't exist, create it
      const { mkdir } = require('fs/promises')
      await mkdir(tempDir, { recursive: true })
      await writeFile(filePath, buffer)
    }

    let extractedText = ''

    try {
      if (file.type === 'application/pdf') {
        // Process PDF file
        const pdfParse = require('pdf-parse')
        const pdfBuffer = await readFile(filePath)
        const pdfData = await pdfParse(pdfBuffer)
        extractedText = pdfData.text
      } else if (file.type.includes('wordprocessingml.document')) {
        // Process DOCX file
        const mammoth = require('mammoth')
        const docxBuffer = await readFile(filePath)
        const result = await mammoth.extractRawText({ buffer: docxBuffer })
        extractedText = result.value
      } else {
        throw new Error('Unsupported file format')
      }

      // Clean up temporary file
      await unlink(filePath)

      // Process extracted text and structure it
      const structuredData = await processExtractedText(extractedText)

      return Response.json({
        success: true,
        data: structuredData,
        fileName: file.name,
        extractedText: extractedText.substring(0, 500) + '...' // Preview
      })

    } catch (processError) {
      // Clean up temporary file in case of error
      try {
        await unlink(filePath)
      } catch (unlinkError) {
        // Ignore unlink errors
      }

      console.error('Error processing file:', processError)
      return Response.json({
        error: 'Failed to process file content',
        details: processError instanceof Error ? processError.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in file upload:', error)
    return Response.json({
      error: 'Failed to upload file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function processExtractedText(text: string): Promise<any[]> {
  // Enhanced text processing using AI to structure the data
  try {
    const { createGoogleGenerativeAI } = require('@ai-sdk/google')
    const { generateText } = require('ai')

    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_AI_API_KEY || "AIzaSyAOGNz-4Qox47O1lTtoTVoBrG1hBrwd1Gk",
    })

    const prompt = `
You are an expert data extraction assistant for municipal services. Extract and structure information from the following text into a JSON array of municipal services.

For each service found, create an object with this exact structure:
{
  "service_name": "Name of the service",
  "category": "One of: Civil Registration, Licenses and Permits, Tax and Revenue, Public Health, Infrastructure, Social Welfare, Urban Planning, Water Supply, Waste Management, Public Safety",
  "description": "Detailed description of what the service provides",
  "requirements": ["List", "of", "required", "documents", "or", "conditions"],
  "process_time": "How long it takes (e.g., '7 days', 'Immediate')",
  "office_location": "Where to apply or get the service",
  "forms_required": ["Form numbers", "or", "application types"],
  "fees": "Cost of the service (e.g., '₹100', 'Free')",
  "additional_info": "Any other relevant information"
}

IMPORTANT RULES:
1. Extract only actual municipal services, not general information
2. If information is missing, use appropriate defaults:
   - process_time: "Contact office for details"
   - fees: "Contact office for fee details"
   - office_location: "Municipal Corporation Office"
3. Ensure each service has a unique, clear service_name
4. Be thorough but accurate - don't invent information not in the text
5. Return valid JSON array only, no additional text

Text to process:
${text}
`

    const { text: aiResponse } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: prompt,
    })

    // Extract JSON from AI response
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const parsedData = JSON.parse(jsonMatch[0])
      return Array.isArray(parsedData) ? parsedData : [parsedData]
    }

    // Fallback: Basic text processing if AI fails
    return fallbackTextProcessing(text)

  } catch (aiError) {
    console.error('AI processing failed, using fallback:', aiError)
    return fallbackTextProcessing(text)
  }
}

function fallbackTextProcessing(text: string): any[] {
  // Basic text processing as fallback
  const services: any[] = []
  
  // Look for common patterns in municipal documents
  const lines = text.split('\n').filter(line => line.trim().length > 0)
  
  let currentService: any = null
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    
    // Check if line looks like a service name (title case, not too long)
    if (trimmedLine.length > 5 && trimmedLine.length < 100 && 
        /^[A-Z]/.test(trimmedLine) && !trimmedLine.includes('.') &&
        (trimmedLine.includes('Certificate') || trimmedLine.includes('License') || 
         trimmedLine.includes('Permit') || trimmedLine.includes('Registration'))) {
      
      // Save previous service if exists
      if (currentService) {
        services.push(currentService)
      }
      
      // Start new service
      currentService = {
        service_name: trimmedLine,
        category: categorizeService(trimmedLine),
        description: '',
        requirements: [],
        process_time: 'Contact office for details',
        office_location: 'Municipal Corporation Office',
        forms_required: [],
        fees: 'Contact office for fee details',
        additional_info: ''
      }
    } else if (currentService && trimmedLine.length > 10) {
      // Add to description if we have a current service
      if (currentService.description.length < 200) {
        currentService.description += (currentService.description ? ' ' : '') + trimmedLine
      }
      
      // Extract specific information
      if (trimmedLine.toLowerCase().includes('requirement') || 
          trimmedLine.toLowerCase().includes('document')) {
        currentService.requirements.push(trimmedLine)
      }
      
      if (trimmedLine.toLowerCase().includes('form') && /\d+/.test(trimmedLine)) {
        currentService.forms_required.push(trimmedLine)
      }
      
      if (trimmedLine.includes('₹') || trimmedLine.toLowerCase().includes('fee')) {
        currentService.fees = trimmedLine
      }
      
      if (trimmedLine.toLowerCase().includes('day') && /\d+/.test(trimmedLine)) {
        currentService.process_time = trimmedLine
      }
    }
  }
  
  // Add last service
  if (currentService) {
    services.push(currentService)
  }
  
  // If no services found, create a generic entry
  if (services.length === 0) {
    services.push({
      service_name: 'Extracted Service Information',
      category: 'Other',
      description: text.substring(0, 200) + '...',
      requirements: ['Manual review required'],
      process_time: 'Contact office for details',
      office_location: 'Municipal Corporation Office',
      forms_required: [],
      fees: 'Contact office for fee details',
      additional_info: 'This entry was automatically extracted and may need manual review'
    })
  }
  
  return services
}

function categorizeService(serviceName: string): string {
  const name = serviceName.toLowerCase()
  
  if (name.includes('birth') || name.includes('death') || name.includes('marriage')) {
    return 'Civil Registration'
  }
  if (name.includes('license') || name.includes('permit')) {
    return 'Licenses and Permits'
  }
  if (name.includes('tax') || name.includes('revenue') || name.includes('property')) {
    return 'Tax and Revenue'
  }
  if (name.includes('health') || name.includes('medical')) {
    return 'Public Health'
  }
  if (name.includes('water') || name.includes('supply')) {
    return 'Water Supply'
  }
  if (name.includes('waste') || name.includes('garbage') || name.includes('sanitation')) {
    return 'Waste Management'
  }
  if (name.includes('building') || name.includes('construction') || name.includes('plan')) {
    return 'Urban Planning'
  }
  if (name.includes('welfare') || name.includes('social')) {
    return 'Social Welfare'
  }
  if (name.includes('road') || name.includes('infrastructure')) {
    return 'Infrastructure'
  }
  if (name.includes('safety') || name.includes('security')) {
    return 'Public Safety'
  }
  
  return 'Other'
}
