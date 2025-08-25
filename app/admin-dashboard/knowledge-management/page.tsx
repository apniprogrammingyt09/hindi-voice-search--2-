'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Upload, FileText, File, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface UploadedFile {
  file: File
  id: string
  status: 'pending' | 'processing' | 'success' | 'error'
  progress: number
  extractedData?: any
  error?: string
}

interface KnowledgeEntry {
  service_name: string
  category: string
  description: string
  requirements: string[]
  process_time: string
  office_location: string
  forms_required?: string[]
  fees?: string
  additional_info?: string
}

export default function KnowledgeManagementPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [manualEntry, setManualEntry] = useState<KnowledgeEntry>({
    service_name: '',
    category: '',
    description: '',
    requirements: [],
    process_time: '',
    office_location: '',
    forms_required: [],
    fees: '',
    additional_info: ''
  })
  const [requirementInput, setRequirementInput] = useState('')
  const [formInput, setFormInput] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const categories = [
    'Civil Registration',
    'Licenses and Permits',
    'Tax and Revenue',
    'Public Health',
    'Infrastructure',
    'Social Welfare',
    'Urban Planning',
    'Water Supply',
    'Waste Management',
    'Public Safety'
  ]

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter(file => 
      file.type === 'application/pdf' || 
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    )

    if (validFiles.length !== files.length) {
      setMessage({ type: 'error', text: 'Only PDF and DOCX files are allowed' })
      return
    }

    const newFiles: UploadedFile[] = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      status: 'pending',
      progress: 0
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])
    
    // Process each file
    for (const uploadedFile of newFiles) {
      await processFile(uploadedFile)
    }
  }

  const processFile = async (uploadedFile: UploadedFile) => {
    setUploadedFiles(prev => prev.map(f => 
      f.id === uploadedFile.id ? { ...f, status: 'processing', progress: 10 } : f
    ))

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile.file)

      const response = await fetch('/api/knowledge/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadedFile.id ? { 
            ...f, 
            status: 'success', 
            progress: 100,
            extractedData: result.data 
          } : f
        ))
      } else {
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadedFile.id ? { 
            ...f, 
            status: 'error', 
            progress: 0,
            error: result.error 
          } : f
        ))
      }
    } catch (error) {
      setUploadedFiles(prev => prev.map(f => 
        f.id === uploadedFile.id ? { 
          ...f, 
          status: 'error', 
          progress: 0,
          error: 'Failed to process file' 
        } : f
      ))
    }
  }

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id))
  }

  const saveToKnowledgeBase = async () => {
    setIsProcessing(true)
    try {
      const successfulFiles = uploadedFiles.filter(f => f.status === 'success')
      
      for (const file of successfulFiles) {
        const response = await fetch('/api/knowledge/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(file.extractedData)
        })

        if (!response.ok) {
          throw new Error(`Failed to save data from ${file.file.name}`)
        }
      }

      setMessage({ type: 'success', text: `Successfully saved ${successfulFiles.length} knowledge entries to database` })
      setUploadedFiles([])
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save to database' })
    } finally {
      setIsProcessing(false)
    }
  }

  const addRequirement = () => {
    if (requirementInput.trim()) {
      setManualEntry(prev => ({
        ...prev,
        requirements: [...prev.requirements, requirementInput.trim()]
      }))
      setRequirementInput('')
    }
  }

  const removeRequirement = (index: number) => {
    setManualEntry(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }))
  }

  const addForm = () => {
    if (formInput.trim()) {
      setManualEntry(prev => ({
        ...prev,
        forms_required: [...(prev.forms_required || []), formInput.trim()]
      }))
      setFormInput('')
    }
  }

  const removeForm = (index: number) => {
    setManualEntry(prev => ({
      ...prev,
      forms_required: prev.forms_required?.filter((_, i) => i !== index) || []
    }))
  }

  const saveManualEntry = async () => {
    if (!manualEntry.service_name || !manualEntry.category || !manualEntry.description) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' })
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch('/api/knowledge/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([manualEntry])
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Manual entry saved successfully!' })
        setManualEntry({
          service_name: '',
          category: '',
          description: '',
          requirements: [],
          process_time: '',
          office_location: '',
          forms_required: [],
          fees: '',
          additional_info: ''
        })
      } else {
        throw new Error('Failed to save manual entry')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save manual entry' })
    } finally {
      setIsProcessing(false)
    }
  }

  const getFileIcon = (fileName: string) => {
    return fileName.endsWith('.pdf') ? <FileText className="h-4 w-4" /> : <File className="h-4 w-4" />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'processing': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base Management</h1>
          <p className="text-muted-foreground">Add new municipal services and processes to the knowledge base</p>
        </div>
      </div>

      {message && (
        <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Documents
            </CardTitle>
            <CardDescription>
              Upload PDF or DOCX files containing municipal service information. 
              The system will automatically extract and structure the data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Drag and drop files here, or click to browse
                </p>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Browse Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Supported formats: PDF, DOCX
              </p>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Uploaded Files</h4>
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.file.name)}
                        <span className="text-sm font-medium truncate">{file.file.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Progress value={file.progress} className="flex-1" />
                      <span className={`text-xs font-medium ${getStatusColor(file.status)}`}>
                        {file.status}
                      </span>
                    </div>
                    
                    {file.error && (
                      <p className="text-xs text-red-600">{file.error}</p>
                    )}
                    
                    {file.extractedData && (
                      <div className="text-xs text-green-600">
                        ✓ Extracted {file.extractedData.length} services
                      </div>
                    )}
                  </div>
                ))}

                <Button 
                  onClick={saveToKnowledgeBase}
                  disabled={isProcessing || !uploadedFiles.some(f => f.status === 'success')}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving to Database...
                    </>
                  ) : (
                    'Save to Knowledge Base'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Entry Section */}
        <Card>
          <CardHeader>
            <CardTitle>Manual Entry</CardTitle>
            <CardDescription>
              Manually add a new municipal service to the knowledge base
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="service_name">Service Name *</Label>
                <Input
                  id="service_name"
                  value={manualEntry.service_name}
                  onChange={(e) => setManualEntry(prev => ({ ...prev, service_name: e.target.value }))}
                  placeholder="e.g., Birth Certificate"
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={manualEntry.category}
                  onValueChange={(value) => setManualEntry(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={manualEntry.description}
                  onChange={(e) => setManualEntry(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of the service"
                  rows={3}
                />
              </div>

              <div>
                <Label>Requirements</Label>
                <div className="flex gap-2">
                  <Input
                    value={requirementInput}
                    onChange={(e) => setRequirementInput(e.target.value)}
                    placeholder="Add requirement"
                    onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
                  />
                  <Button type="button" onClick={addRequirement}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {manualEntry.requirements.map((req, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {req}
                      <button
                        onClick={() => removeRequirement(index)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="process_time">Processing Time</Label>
                  <Input
                    id="process_time"
                    value={manualEntry.process_time}
                    onChange={(e) => setManualEntry(prev => ({ ...prev, process_time: e.target.value }))}
                    placeholder="e.g., 7 days"
                  />
                </div>

                <div>
                  <Label htmlFor="fees">Fees</Label>
                  <Input
                    id="fees"
                    value={manualEntry.fees}
                    onChange={(e) => setManualEntry(prev => ({ ...prev, fees: e.target.value }))}
                    placeholder="e.g., ₹100"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="office_location">Office Location</Label>
                <Input
                  id="office_location"
                  value={manualEntry.office_location}
                  onChange={(e) => setManualEntry(prev => ({ ...prev, office_location: e.target.value }))}
                  placeholder="e.g., Municipal Corporation Office"
                />
              </div>

              <div>
                <Label>Forms Required</Label>
                <div className="flex gap-2">
                  <Input
                    value={formInput}
                    onChange={(e) => setFormInput(e.target.value)}
                    placeholder="Add form"
                    onKeyPress={(e) => e.key === 'Enter' && addForm()}
                  />
                  <Button type="button" onClick={addForm}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {manualEntry.forms_required?.map((form, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {form}
                      <button
                        onClick={() => removeForm(index)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="additional_info">Additional Information</Label>
                <Textarea
                  id="additional_info"
                  value={manualEntry.additional_info}
                  onChange={(e) => setManualEntry(prev => ({ ...prev, additional_info: e.target.value }))}
                  placeholder="Any additional information"
                  rows={2}
                />
              </div>
            </div>

            <Separator />

            <Button 
              onClick={saveManualEntry}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Manual Entry'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
