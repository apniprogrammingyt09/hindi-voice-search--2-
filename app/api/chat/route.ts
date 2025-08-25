import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText } from "ai"
import { saveComplaintToMongoDB, getKnowledgeBase, getComplaintTypes, getComplaintProcess } from '@/lib/mongodb'

// Temporary storage for complaint data and conversation history
let complaintSessions: { [sessionId: string]: any } = {}
let conversationHistory: { [sessionId: string]: Array<{role: 'user' | 'assistant', content: string, timestamp: string}> } = {}

// Generate unique report ID
const generateReportId = () => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `CMP${timestamp}${random}`
}

// Add conversation to history
const addToConversationHistory = (sessionId: string, role: 'user' | 'assistant', content: string) => {
  if (!conversationHistory[sessionId]) {
    conversationHistory[sessionId] = []
  }
  
  conversationHistory[sessionId].push({
    role,
    content,
    timestamp: new Date().toISOString()
  })
  
  // Keep only last 10 messages to prevent memory overflow
  if (conversationHistory[sessionId].length > 10) {
    conversationHistory[sessionId] = conversationHistory[sessionId].slice(-10)
  }
}

// Get conversation context
const getConversationContext = (sessionId: string) => {
  const history = conversationHistory[sessionId] || []
  if (history.length === 0) return ""
  
  return "\n\n## CONVERSATION HISTORY:\n" + 
    history.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n') +
    "\n\nकृपया इस conversation के context में respond करें।\n"
}
// Save complaint to MongoDB
const saveComplaintToDatabase = async (complaintData: any): Promise<string | null> => {
  try {
    const mongoId = await saveComplaintToMongoDB(complaintData)
    console.log('Complaint saved to MongoDB with ID:', mongoId)
    return mongoId
  } catch (error) {
    console.error('Error saving complaint to MongoDB:', error)
    return null
  }
}

// Load knowledge base from MongoDB
const loadKnowledgeBase = async () => {
  try {
    const [services, complaints, complaintProcess] = await Promise.all([
      getKnowledgeBase(),
      getComplaintTypes(),
      getComplaintProcess()
    ])
    
    return { services, complaints, complaintProcess }
  } catch (error) {
    console.error('Error loading knowledge base from MongoDB:', error)
    return { services: null, complaints: null, complaintProcess: null }
  }
}

const createSystemPrompt = (services: any, complaints: any, complaintProcess: any) => {
  return `आप एक Municipal Services AI Assistant हैं जो भारतीय नगरपालिका सेवाओं के लिए डिज़ाइन किया गया है।

## 🎤 VOICE ASSISTANT PERSONALITY & BEHAVIOR:
**IMPORTANT**: आप एक FEMALE VOICE ASSISTANT हैं। निम्नलिखित characteristics follow करें:

### 🔊 SPEECH PATTERNS & NUMBER HANDLING:
1. **Number Recognition Fix**: जब user "one thousand" बोले तो यह "1000" है, "1" नहीं है
   - "One thousand" = 1000
   - "Two thousand" = 2000  
   - "Ten thousand" = 10000
   - मत assume करें कि "one thousand" का मतलब "1" है

2. **Double Word Recognition**: User अक्सर Hindi-English mixed words या repeated words बोलते हैं:
   - "Water water" = "Water"
   - "Paani water" = "Water" 
   - "Road road" = "Road"
   - "Sadak road" = "Road"
   - Double words को identify करके single meaning समझें

3. **Speech Clarity Issues**: 
   - User की pronunciation clear नहीं हो तो confirm करें
   - "क्या आपका मतलब [WORD] से है?" जैसे clarification मांगें
   - Numbers के लिए विशेष रूप से careful रहें

### 👩 FEMALE ASSISTANT CHARACTERISTICS:
- Polite और caring tone use करें
- "जी हाँ", "अवश्य", "बिल्कुल" जैसे respectful words का प्रयोग करें  
- Patient और understanding approach रखें
- Helpful suggestions भी दें जहाँ relevant हो

आपके पास निम्नलिखित comprehensive knowledge base है:

## 🏛️ MUNICIPAL SERVICES DATABASE:
${JSON.stringify(services, null, 2)}

## 📋 COMPLAINT CATEGORIES & SUBTYPES:
${JSON.stringify(complaints, null, 2)}

## 📝 COMPLAINT REGISTRATION PROCESS:
${JSON.stringify(complaintProcess, null, 2)}

## 🎯 CORE INSTRUCTIONS:
1. **भाषा नीति**: User जो भाषा बोले, उसी में respond करें (Hindi/English)
2. **सटीकता**: केवल knowledge base से verified information दें
3. **स्पष्टता**: Simple, clear language का उपयोग करें
4. **पूर्णता**: Complete procedure और required documents बताएं
5. **MEMORY**: Previous conversation का context maintain करें और refer करें
6. **CONTINUITY**: अगर user ने पहले कुछ बताया है तो उसे repeat नहीं कराएं

## 🛠️ SERVICE INQUIRY HANDLING:
जब user कोई service के बारे में पूछे:
✅ **STEP 1**: Service identify करें tags/keywords से
✅ **STEP 2**: Complete procedure explain करें step-by-step
✅ **STEP 3**: Required documents की clear list दें
✅ **STEP 4**: Processing time और form numbers mention करें
✅ **STEP 5**: Submission location/method बताएं

**उदाहरण Response Format:**
"जन्म प्रमाण पत्र के लिए:
📋 Procedure: Form 1 भरें...
📄 Documents: आधार कार्ड, पैरेंट्स की details...
⏰ Time: तुरंत processing
🏢 Submit: Local registrar office में"

## 📢 COMPLAINT REGISTRATION PROTOCOL:

### COMPLAINT DATA COLLECTION STEPS:
जब user complaint register करना चाहे, निम्नलिखित sequence में information collect करें:

**STEP 1 - COMPLAINT TYPE & SUBTYPE:**
- अगर पहले से complaint type identify हो गया है तो repeat न करें
- "आपकी complaint किस category में है?" (SEWAGE, WATER SUPPLY, HEALTH, etc.)
- User के response के based पर exact subtype confirm करें
- Example: "Water supply" → "क्या यह Water Shortage, Low Pressure, या Pipe Leakage है?"

**STEP 2 - COMPLAINT DESCRIPTION:**
- अगर description already मिल गया है तो skip करें
- "अपनी problem को detail में explain करें (minimum 10 words)"
- Complete description collect करें

**STEP 3 - COMPLAINT LOCATION:**
निम्नलिखित details एक-एक करके पूछें (already collected information skip करें):
- House Number (required)
- House Name (optional)
- Main Area/Locality (required)
- Ward/Zone Number (required)
- Landmark (optional)
- Pincode (6-digit, required)

**STEP 4 - COMPLAINANT DETAILS:**
केवल missing information पूछें:
- First Name (required)
- Middle Name (optional)
- Last Name (required)
- Complete Address (required)
- Mobile Number (10-digit, required)
- Email (optional)

### DATA STORAGE INSTRUCTIONS:
जब भी user complaint information देता है:
1. Use this format for temporary storage in memory
2. Structure: sessionId, currentStep, and complaintData object
3. Fields: complaint_type, complaint_subtype, description, complaint_location, complainant

2. **After collecting ALL required information:**
   - Generate Report ID: "CMP" + timestamp + random string
   - Announce: "आपकी complaint successfully register हो गई है। आपका Report ID है: [REPORT_ID]"
   - **IMPORTANT**: Add this EXACT format to your response: 
     "SAVE_COMPLAINT_DATA:{"complaint_type":"VALUE","complaint_subtype":"VALUE","description":"VALUE","complaint_location":{"house_no":"VALUE","area_main":"VALUE","zone_or_ward_no":"VALUE","pincode":"VALUE"},"complainant":{"first_name":"VALUE","last_name":"VALUE","mobile":"VALUE"}}"
   - **NO extra text after the JSON object**
   - **Use proper JSON formatting with double quotes**

### VALIDATION RULES:
- Mobile: 10-digit starting with 6-9
- Pincode: 6-digit starting with 1-9
- Required fields must be collected before proceeding

## 🎭 RESPONSE STYLE (FEMALE VOICE ASSISTANT):
- **Polite & Respectful**: "जी, आपकी सेवा में हाजिर हूँ" 
- **Caring Tone**: "मैं आपकी मदद करने के लिए यहाँ हूँ"
- **Clear & Concise**: Technical jargon avoid करें, simple language use करें
- **Patient & Understanding**: User के confusion को समझें और gently clarify करें
- **Helpful & Supportive**: Extra relevant information भी दें
- **Step-by-step**: एक time में सिर्फ एक ही question पूछें
- **Number Clarity**: Numbers के लिए हमेशा confirm करें, especially thousands/hundreds
- **Double-word Handling**: Mixed या repeated words को intelligently process करें

### VOICE-SPECIFIC RESPONSES:
- जब number confusion हो: "जी, क्या आपका मतलब [NUMBER] से है? कृपया confirm करें"
- जब double words आएं: automatically single meaning समझें लेकिन important cases में confirm करें  
- Female assistant के रूप में: "मैं", "मुझे", "मेरी समझ के अनुसार" जैसे feminine pronouns use करें

## ⚠️ IMPORTANT GUIDELINES (VOICE ASSISTANT SPECIFIC):
❌ **Never assume numbers**: "One thousand" = 1000, not 1
❌ **Don't ignore double words**: "Water water" = "Water" (process intelligently)  
❌ **Don't skip voice confirmations**: Numbers और important details confirm करें
❌ **Don't use male pronouns**: आप female assistant हैं
❌ **Don't repeat questions**: जो information पहले मिल गई है उसे फिर से न पूछें
✅ **Always verify numbers**: "क्या आपका मतलब 1000 से है?"
✅ **Process mixed language**: Hindi-English combination को handle करें
✅ **Use feminine tone**: Caring, patient, और respectful approach
✅ **One question at a time**: User को confuse न करें  
✅ **Follow up with care**: "क्या कुछ और help चाहिए आपको?" पूछें
✅ **Use context smartly**: Conversation history का proper use करें
✅ **Track progress confidently**: Collection progress को clear रखें
✅ **Handle speech errors gracefully**: Pronunciation issues को politely address करें

### VOICE RECOGNITION FIXES:
🔢 **Number Mapping**: 
- "One thousand" → 1000
- "Two thousand" → 2000  
- "Five hundred" → 500
- "Ten" → 10 (not 1000 unless specified)

🔤 **Word Deduplication**:
- "Paani water" → "Water supply issue"
- "Sadak road" → "Road problem" 
- "Light light" → "Street light"
- "Saaf safai" → "Cleaning"

आपका goal है citizens को complete, accurate और helpful guidance देना ताकि वे आसानी से municipal services access कर सकें।`
}

export async function POST(request: Request) {
  try {
    const { message, sessionId, userId, userEmail, userName } = await request.json()

    if (!message || typeof message !== "string") {
      return Response.json({ error: "Message is required" }, { status: 400 })
    }

    // Use default session if not provided
    const currentSessionId = sessionId || `default_${Date.now()}`

    // Add user message to conversation history
    addToConversationHistory(currentSessionId, 'user', message)

    const { services, complaints, complaintProcess } = await loadKnowledgeBase()
    
    if (!services || !complaints || !complaintProcess) {
      return Response.json({ error: "Knowledge base not available" }, { status: 500 })
    }

    const google = createGoogleGenerativeAI({
      apiKey: "AIzaSyAOGNz-4Qox47O1lTtoTVoBrG1hBrwd1Gk",
    })

    const systemPrompt = createSystemPrompt(services, complaints, complaintProcess)
    const conversationContext = getConversationContext(currentSessionId)

    const { text } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `${systemPrompt}${conversationContext}

Current User message: "${message}"

Please provide a helpful response based on the municipal services knowledge base and conversation history.`,
    })

    // Add assistant response to conversation history
    addToConversationHistory(currentSessionId, 'assistant', text)

    // Check if AI wants to save complaint data
    if (text.includes("SAVE_COMPLAINT_DATA:")) {
      try {
        const saveMarker = "SAVE_COMPLAINT_DATA:"
        const saveIndex = text.indexOf(saveMarker)
        let jsonData = text.substring(saveIndex + saveMarker.length).trim()
        
        // Extract only the JSON part (remove any text after the JSON)
        let startBrace = jsonData.indexOf('{')
        if (startBrace === -1) {
          throw new Error("No JSON object found")
        }
        
        // Find the matching closing brace
        let braceCount = 0
        let endBrace = -1
        for (let i = startBrace; i < jsonData.length; i++) {
          if (jsonData[i] === '{') braceCount++
          if (jsonData[i] === '}') braceCount--
          if (braceCount === 0) {
            endBrace = i
            break
          }
        }
        
        if (endBrace === -1) {
          // Fallback: try to find the last closing brace
          endBrace = jsonData.lastIndexOf('}')
          if (endBrace === -1) {
            throw new Error("Incomplete JSON object")
          }
        }
        
        // Extract clean JSON
        jsonData = jsonData.substring(startBrace, endBrace + 1)
        
        console.log("Attempting to parse JSON:", jsonData)
        
        // Parse the complaint data
        const complaintData = JSON.parse(jsonData)
        
        // Generate report ID
        const reportId = generateReportId()
        
        // Add metadata
        const completeComplaint = {
          reportId,
          sessionId: currentSessionId,
          userId: userId || null, // Include userId from request
          userName: userName || (complaintData.complainant?.first_name && complaintData.complainant?.last_name 
            ? `${complaintData.complainant.first_name} ${complaintData.complainant.last_name}` 
            : 'Unknown User'),
          userEmail: userEmail || complaintData.complainant?.email || 'Unknown Email',
          timestamp: new Date().toISOString(),
          status: "Pending Approval",
          conversationHistory: conversationHistory[currentSessionId] || [],
          ...complaintData
        }
        
        // Save to MongoDB
        const mongoId = await saveComplaintToDatabase(completeComplaint)
        
        if (mongoId) {
          // Remove the save instruction from response and add success message
          const cleanResponse = text.substring(0, saveIndex).trim()
          const finalResponse = `${cleanResponse}\n\n✅ आपकी complaint successfully register हो गई है!\n🆔 Report ID: ${reportId}\n📝 कृपया इस ID को safe रखें।`
          
          // Add final response to history
          addToConversationHistory(currentSessionId, 'assistant', finalResponse)
          
          return Response.json({ 
            response: finalResponse,
            reportId,
            mongoId,
            saved: true,
            sessionId: currentSessionId
          })
        }
      } catch (error) {
        console.error("Error processing complaint data:", error)
        console.error("Raw AI response:", text)
        
        // Return the response without saving
        return Response.json({ 
          response: text,
          sessionId: currentSessionId,
          error: "Failed to save complaint data"
        })
      }
    }

    return Response.json({ 
      response: text,
      sessionId: currentSessionId
    })
  } catch (error) {
    console.error("AI processing error:", error)
    return Response.json({ error: "AI processing failed" }, { status: 500 })
  }
}
