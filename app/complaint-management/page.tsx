"use client"

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Calendar, 
  MapPin, 
  User, 
  Phone, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Shield,
  Eye,
  MessageSquare
} from 'lucide-react'

interface Complaint {
  _id: string
  reportId: string
  complaint_type: string
  complaint_subtype: string
  description: string
  status: string
  createdAt: string
  complainant?: {
    first_name: string
    last_name: string
    mobile: string
  }
  complaint_location?: {
    house_no: string
    area_main: string
    pincode: string
  }
  rejectionReason?: string
  lastUpdatedBy?: {
    adminId: string
    adminEmail: string
    timestamp: string
  }
}

const COMPLAINT_CATEGORIES = {
  'sewage': { label: 'Sewage', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  'health care': { label: 'Health Care', color: 'bg-red-100 text-red-800 border-red-200' },
  'water and electricity': { label: 'Water & Electricity', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  'engineering': { label: 'Engineering', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  'finance': { label: 'Finance', color: 'bg-green-100 text-green-800 border-green-200' },
  'fire brigade': { label: 'Fire Brigade', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  'other': { label: 'Other', color: 'bg-gray-100 text-gray-800 border-gray-200' }
}

const STATUS_COLORS = {
  'Pending Approval': 'bg-orange-100 text-orange-800 border-orange-200',
  'Approved': 'bg-blue-100 text-blue-800 border-blue-200',
  'Rejected': 'bg-red-100 text-red-800 border-red-200',
  'In Progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Completed': 'bg-green-100 text-green-800 border-green-200',
  'Closed': 'bg-gray-100 text-gray-800 border-gray-200'
}

const ITEMS_PER_PAGE = 6

export default function ComplaintManagementPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('Pending Approval')
  const [currentPage, setCurrentPage] = useState(1)
  
  // Modal states
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectionDialog, setShowRejectionDialog] = useState(false)

  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/complaints')
      const data = await response.json()
      
      if (response.ok) {
        setComplaints(data.complaints || [])
      } else {
        setError(data.error || 'Failed to fetch complaints')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error fetching complaints:', err)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryKey = (complaintType: string): string => {
    const type = complaintType.toLowerCase()
    if (type.includes('sewage') || type.includes('drainage')) return 'sewage'
    if (type.includes('health') || type.includes('medical')) return 'health care'
    if (type.includes('water') || type.includes('electricity') || type.includes('power')) return 'water and electricity'
    if (type.includes('engineering') || type.includes('construction') || type.includes('road')) return 'engineering'
    if (type.includes('finance') || type.includes('tax') || type.includes('payment')) return 'finance'
    if (type.includes('fire') || type.includes('emergency')) return 'fire brigade'
    return 'other'
  }

  const filteredComplaints = useMemo(() => {
    return complaints.filter(complaint => {
      const searchMatch = searchQuery === '' || 
        complaint.reportId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.complaint_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.complainant?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.complainant?.last_name?.toLowerCase().includes(searchQuery.toLowerCase())

      const statusMatch = selectedStatus === 'all' || complaint.status === selectedStatus

      return searchMatch && statusMatch
    })
  }, [complaints, searchQuery, selectedStatus])

  const paginatedComplaints = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredComplaints.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredComplaints, currentPage])

  const totalPages = Math.ceil(filteredComplaints.length / ITEMS_PER_PAGE)

  const handleStatusUpdate = async (reportId: string, newStatus: string, reason?: string) => {
    try {
      setIsUpdatingStatus(true)
      
      const response = await fetch('/api/complaints/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId,
          status: newStatus,
          adminId: 'admin_001',
          adminEmail: 'bhagatkrish65@gmail.com',
          reason
        }),
      })

      const data = await response.json()

      if (response.ok) {
        fetchComplaints()
        if (selectedComplaint?.reportId === reportId) {
          setSelectedComplaint(prev => prev ? { ...prev, status: newStatus } : null)
        }
        setShowRejectionDialog(false)
        setRejectionReason('')
        setIsDetailsModalOpen(false)
      } else {
        console.error('Failed to update status:', data.error)
      }
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleViewDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint)
    setIsDetailsModalOpen(true)
  }

  const handleReject = () => {
    if (selectedComplaint && rejectionReason.trim()) {
      handleStatusUpdate(selectedComplaint.reportId, 'Rejected', rejectionReason)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Loading complaints...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card className="border-destructive">
          <CardContent className="text-center py-8">
            <div className="text-destructive mb-4">
              <FileText className="h-12 w-12 mx-auto mb-2" />
              <p className="text-lg font-semibold">Error loading complaints</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <Button onClick={fetchComplaints} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Complaint Management</h1>
          <p className="text-muted-foreground mt-1">Review, approve, and manage municipal complaints</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchComplaints} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-xl font-bold">
                  {complaints.filter(c => c.status === 'Pending Approval').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-xl font-bold">
                  {complaints.filter(c => c.status === 'Approved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-xl font-bold">
                  {complaints.filter(c => c.status === 'In Progress').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-xl font-bold">
                  {complaints.filter(c => c.status === 'Completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Complaints
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search complaints..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('')
                  setSelectedStatus('Pending Approval')
                  setCurrentPage(1)
                }} 
                className="w-full"
              >
                Reset Filters
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredComplaints.length} complaints
          </div>
        </CardContent>
      </Card>

      {/* Complaints Grid */}
      {filteredComplaints.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No complaints found</h3>
            <p className="text-muted-foreground">
              {selectedStatus === 'Pending Approval' 
                ? 'No complaints are pending approval.' 
                : `No complaints with status "${selectedStatus}".`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {paginatedComplaints.map((complaint) => {
              const categoryKey = getCategoryKey(complaint.complaint_type)
              const category = COMPLAINT_CATEGORIES[categoryKey as keyof typeof COMPLAINT_CATEGORIES]
              
              return (
                <Card key={complaint._id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={`${category.color} font-medium`}>
                            {category.label}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={STATUS_COLORS[complaint.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800 border-gray-200'}
                          >
                            {complaint.status}
                          </Badge>
                          {complaint.status === 'Pending Approval' && (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              Needs Action
                            </Badge>
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg leading-tight">
                            {complaint.complaint_type}
                            {complaint.complaint_subtype && (
                              <span className="text-muted-foreground font-normal"> • {complaint.complaint_subtype}</span>
                            )}
                          </CardTitle>
                          <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">
                              {complaint.reportId}
                            </span>
                            <Separator orientation="vertical" className="h-3" />
                            <Calendar className="h-3 w-3" />
                            {new Date(complaint.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(complaint)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View & Action
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Description
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                          {complaint.description}
                        </p>
                      </div>
                      
                      {complaint.complainant && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Complainant
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p className="font-medium">
                              {complaint.complainant.first_name} {complaint.complainant.last_name}
                            </p>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {complaint.complainant.mobile}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Actions */}
                    {complaint.status === 'Pending Approval' && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(complaint.reportId, 'Approved')}
                            disabled={isUpdatingStatus}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedComplaint(complaint)
                              setShowRejectionDialog(true)
                            }}
                            disabled={isUpdatingStatus}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}

                    {complaint.status === 'Approved' && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(complaint.reportId, 'In Progress')}
                            disabled={isUpdatingStatus}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Start Work
                          </Button>
                        </div>
                      </div>
                    )}

                    {complaint.status === 'In Progress' && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(complaint.reportId, 'Completed')}
                            disabled={isUpdatingStatus}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Complete
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card>
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages} • {filteredComplaints.length} total complaints
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Rejection Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Complaint</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this complaint. This will be visible to the complainant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowRejectionDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleReject}
                disabled={!rejectionReason.trim() || isUpdatingStatus}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject Complaint
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Complaint Management
            </DialogTitle>
            <DialogDescription>
              Review complaint details and take appropriate action.
            </DialogDescription>
          </DialogHeader>
          
          {selectedComplaint && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Complaint Details</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Type:</span> {selectedComplaint.complaint_type}</div>
                    <div><span className="font-medium">Report ID:</span> {selectedComplaint.reportId}</div>
                    <div><span className="font-medium">Status:</span> 
                      <Badge variant="outline" className={`ml-2 ${STATUS_COLORS[selectedComplaint.status as keyof typeof STATUS_COLORS]}`}>
                        {selectedComplaint.status}
                      </Badge>
                    </div>
                    <div><span className="font-medium">Submitted:</span> {new Date(selectedComplaint.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                
                {selectedComplaint.complainant && (
                  <div>
                    <h3 className="font-semibold mb-3">Complainant Details</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Name:</span> {selectedComplaint.complainant.first_name} {selectedComplaint.complainant.last_name}</div>
                      <div><span className="font-medium">Phone:</span> {selectedComplaint.complainant.mobile}</div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-3">Description</h3>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  {selectedComplaint.description}
                </p>
              </div>

              {selectedComplaint.complaint_location && (
                <div>
                  <h3 className="font-semibold mb-3">Location</h3>
                  <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {selectedComplaint.complaint_location.house_no}, {selectedComplaint.complaint_location.area_main}
                    <br />PIN: {selectedComplaint.complaint_location.pincode}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Admin Actions</h3>
                <div className="flex gap-3">
                  {selectedComplaint.status === 'Pending Approval' && (
                    <>
                      <Button
                        onClick={() => handleStatusUpdate(selectedComplaint.reportId, 'Approved')}
                        disabled={isUpdatingStatus}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => setShowRejectionDialog(true)}
                        disabled={isUpdatingStatus}
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                  {selectedComplaint.status === 'Approved' && (
                    <Button
                      onClick={() => handleStatusUpdate(selectedComplaint.reportId, 'In Progress')}
                      disabled={isUpdatingStatus}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Start Work
                    </Button>
                  )}
                  {selectedComplaint.status === 'In Progress' && (
                    <Button
                      onClick={() => handleStatusUpdate(selectedComplaint.reportId, 'Completed')}
                      disabled={isUpdatingStatus}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
