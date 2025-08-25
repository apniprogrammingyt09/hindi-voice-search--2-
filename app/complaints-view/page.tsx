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
  MoreHorizontal,
  Download,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Shield,
  XCircle
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
  'Closed': 'bg-gray-100 text-gray-800 border-gray-200',
  'Registered': 'bg-blue-100 text-blue-800 border-blue-200' // Fallback for old data
}

const ITEMS_PER_PAGE = 10

export default function ComplaintsViewPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  
  // Pagination states
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
    let filtered = complaints.filter(complaint => {
      // Search filter
      const searchMatch = searchQuery === '' || 
        complaint.reportId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.complaint_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.complainant?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.complainant?.last_name?.toLowerCase().includes(searchQuery.toLowerCase())

      // Category filter
      const categoryMatch = selectedCategory === 'all' || 
        getCategoryKey(complaint.complaint_type) === selectedCategory

      // Status filter
      const statusMatch = selectedStatus === 'all' || 
        complaint.status === selectedStatus

      // Date filter
      let dateMatch = true
      if (dateFilter !== 'all') {
        const complaintDate = new Date(complaint.createdAt)
        const now = new Date()
        const daysDiff = Math.floor((now.getTime() - complaintDate.getTime()) / (1000 * 60 * 60 * 24))
        
        switch (dateFilter) {
          case 'today':
            dateMatch = daysDiff === 0
            break
          case 'week':
            dateMatch = daysDiff <= 7
            break
          case 'month':
            dateMatch = daysDiff <= 30
            break
        }
      }

      return searchMatch && categoryMatch && statusMatch && dateMatch
    })

    return filtered
  }, [complaints, searchQuery, selectedCategory, selectedStatus, dateFilter])

  const paginatedComplaints = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredComplaints.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredComplaints, currentPage])

  const totalPages = Math.ceil(filteredComplaints.length / ITEMS_PER_PAGE)

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedStatus('all')
    setDateFilter('all')
    setCurrentPage(1)
  }

  const handleViewDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint)
    setIsDetailsModalOpen(true)
  }

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
          adminId: 'admin_001', // You can get this from auth context
          adminEmail: 'bhagatkrish65@gmail.com', // You can get this from auth context
          reason
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Refresh complaints list
        fetchComplaints()
        // Update selected complaint if modal is open
        if (selectedComplaint?.reportId === reportId) {
          setSelectedComplaint(prev => prev ? { ...prev, status: newStatus } : null)
        }
        setShowRejectionDialog(false)
        setRejectionReason('')
      } else {
        console.error('Failed to update status:', data.error)
      }
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setIsUpdatingStatus(false)
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
          <h1 className="text-3xl font-bold text-foreground">Complaints Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage and track municipal complaints</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchComplaints} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Report ID, type, description, or complainant name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(COMPLAINT_CATEGORIES).map(([key, category]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${category.color.split(' ')[0]}`} />
                        {category.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="Registered">Registered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 days</SelectItem>
                  <SelectItem value="month">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button variant="outline" onClick={resetFilters} className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Filter Summary */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
            <span className="text-sm text-muted-foreground">
              Showing {filteredComplaints.length} of {complaints.length} complaints
            </span>
            {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all' || dateFilter !== 'all') && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex flex-wrap gap-1">
                  {searchQuery && (
                    <Badge variant="secondary" className="text-xs">
                      Search: "{searchQuery}"
                    </Badge>
                  )}
                  {selectedCategory !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      Category: {COMPLAINT_CATEGORIES[selectedCategory as keyof typeof COMPLAINT_CATEGORIES]?.label}
                    </Badge>
                  )}
                  {selectedStatus !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      Status: {selectedStatus}
                    </Badge>
                  )}
                  {dateFilter !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      Date: {dateFilter}
                    </Badge>
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Complaints Grid */}
      {filteredComplaints.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No complaints found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'No complaints have been registered yet.'}
            </p>
            {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all' || dateFilter !== 'all') && (
              <Button variant="outline" onClick={resetFilters}>
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedComplaints.map((complaint) => {
              const categoryKey = getCategoryKey(complaint.complaint_type)
              const category = COMPLAINT_CATEGORIES[categoryKey as keyof typeof COMPLAINT_CATEGORIES]
              
              return (
                <Card key={complaint._id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`${category.color} font-medium`}
                          >
                            {category.label}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={STATUS_COLORS[complaint.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800 border-gray-200'}
                          >
                            {complaint.status}
                          </Badge>
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
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetails(complaint)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 space-y-3">
                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Description
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {complaint.description}
                          </p>
                        </div>
                        
                        {complaint.complaint_location && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Location
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {complaint.complaint_location.house_no}, {complaint.complaint_location.area_main}
                              <br />
                              <span className="text-xs">PIN: {complaint.complaint_location.pincode}</span>
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {complaint.complainant && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Complainant Details
                          </h4>
                          <div className="space-y-2 text-sm">
                            <p className="font-medium">
                              {complaint.complainant.first_name} {complaint.complainant.last_name}
                            </p>
                            <p className="text-muted-foreground flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              {complaint.complainant.mobile}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
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
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredComplaints.length)} of {filteredComplaints.length} results
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
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            className="w-10 h-10"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <>
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-10 h-10"
                            onClick={() => setCurrentPage(totalPages)}
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>
                    
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

      {/* Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] w-[95vw] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Complaint Details
            </DialogTitle>
            <DialogDescription>
              View detailed information about this complaint including status, location, and complainant details.
            </DialogDescription>
          </DialogHeader>
          
          {selectedComplaint && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex flex-col gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`${COMPLAINT_CATEGORIES[getCategoryKey(selectedComplaint.complaint_type) as keyof typeof COMPLAINT_CATEGORIES].color} font-medium text-xs sm:text-sm`}
                      >
                        {COMPLAINT_CATEGORIES[getCategoryKey(selectedComplaint.complaint_type) as keyof typeof COMPLAINT_CATEGORIES].label}
                      </Badge>
                      <Badge 
                        variant="outline"
                        className={`${STATUS_COLORS[selectedComplaint.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800 border-gray-200'} text-xs sm:text-sm`}
                      >
                        {selectedComplaint.status}
                      </Badge>
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold break-words">
                      {selectedComplaint.complaint_type}
                      {selectedComplaint.complaint_subtype && (
                        <span className="text-muted-foreground font-normal"> • {selectedComplaint.complaint_subtype}</span>
                      )}
                    </h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-mono bg-background px-2 py-1 rounded border text-xs sm:text-sm break-all">
                        {selectedComplaint.reportId}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs sm:text-sm">
                          {new Date(selectedComplaint.createdAt).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <Clock className="h-4 w-4" />
                        <span className="text-xs sm:text-sm">
                          {new Date(selectedComplaint.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Actions */}
              {(selectedComplaint.status === 'Pending Approval' || selectedComplaint.status === 'Approved') && (
                <Card className="border-2 border-dashed border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Admin Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {selectedComplaint.status === 'Pending Approval' && (
                        <>
                          <Button
                            onClick={() => handleStatusUpdate(selectedComplaint.reportId, 'Approved')}
                            disabled={isUpdatingStatus}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve Complaint
                          </Button>
                          <Button
                            onClick={() => setShowRejectionDialog(true)}
                            disabled={isUpdatingStatus}
                            variant="destructive"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject Complaint
                          </Button>
                        </>
                      )}
                      {selectedComplaint.status === 'Approved' && (
                        <>
                          <Button
                            onClick={() => handleStatusUpdate(selectedComplaint.reportId, 'In Progress')}
                            disabled={isUpdatingStatus}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Mark In Progress
                          </Button>
                          <Button
                            onClick={() => handleStatusUpdate(selectedComplaint.reportId, 'Completed')}
                            disabled={isUpdatingStatus}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Completed
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Main Content */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Description */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Complaint Description
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed break-words">
                        {selectedComplaint.description}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Location Details */}
                  {selectedComplaint.complaint_location && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          Location Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">House No.</label>
                            <p className="font-medium break-words">{selectedComplaint.complaint_location.house_no || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">PIN Code</label>
                            <p className="font-medium">{selectedComplaint.complaint_location.pincode || 'N/A'}</p>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Area</label>
                          <p className="font-medium break-words">{selectedComplaint.complaint_location.area_main || 'N/A'}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Complainant Details */}
                  {selectedComplaint.complainant && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Complainant Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">
                              {selectedComplaint.complainant.first_name} {selectedComplaint.complainant.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {selectedComplaint.complainant.mobile}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Status Timeline */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Status Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Complaint Registered */}
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">Complaint Registered</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(selectedComplaint.createdAt).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>

                        {/* Pending Approval */}
                        {(selectedComplaint.status === 'Pending Approval' || 
                          selectedComplaint.status === 'Approved' || 
                          selectedComplaint.status === 'Rejected' ||
                          selectedComplaint.status === 'In Progress' ||
                          selectedComplaint.status === 'Completed') && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                              <Clock className="h-4 w-4 text-orange-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">Pending Admin Approval</p>
                              <p className="text-xs text-muted-foreground">
                                Waiting for admin review
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Approved */}
                        {(selectedComplaint.status === 'Approved' || 
                          selectedComplaint.status === 'In Progress' ||
                          selectedComplaint.status === 'Completed') && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">Complaint Approved</p>
                              <p className="text-xs text-muted-foreground">
                                Approved by admin
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Rejected */}
                        {selectedComplaint.status === 'Rejected' && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                              <XCircle className="h-4 w-4 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">Complaint Rejected</p>
                              <p className="text-xs text-muted-foreground">
                                Rejected by admin
                              </p>
                            </div>
                          </div>
                        )}

                        {/* In Progress */}
                        {(selectedComplaint.status === 'In Progress' ||
                          selectedComplaint.status === 'Completed') && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">Work In Progress</p>
                              <p className="text-xs text-muted-foreground">
                                Issue is being resolved
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Completed */}
                        {selectedComplaint.status === 'Completed' && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">Complaint Resolved</p>
                              <p className="text-xs text-muted-foreground">
                                Issue has been completed
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Additional Information */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Additional Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                          <span className="text-sm text-muted-foreground">Complaint ID:</span>
                          <span className="text-sm font-mono font-medium break-all sm:text-right">{selectedComplaint._id}</span>
                        </div>
                        <Separator />
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                          <span className="text-sm text-muted-foreground">Report ID:</span>
                          <span className="text-sm font-mono font-medium break-all sm:text-right">{selectedComplaint.reportId}</span>
                        </div>
                        <Separator />
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                          <span className="text-sm text-muted-foreground">Category:</span>
                          <span className="text-sm font-medium sm:text-right">
                            {COMPLAINT_CATEGORIES[getCategoryKey(selectedComplaint.complaint_type) as keyof typeof COMPLAINT_CATEGORIES].label}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                          <span className="text-sm text-muted-foreground">Current Status:</span>
                          <div className="sm:text-right">
                            <Badge variant="outline" className="text-xs">
                              {selectedComplaint.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Reason Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Reject Complaint
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for rejection</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this complaint..."
                rows={4}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectionDialog(false)
                  setRejectionReason('')
                }}
                disabled={isUpdatingStatus}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedComplaint && handleStatusUpdate(selectedComplaint.reportId, 'Rejected', rejectionReason)}
                disabled={isUpdatingStatus || !rejectionReason.trim()}
              >
                {isUpdatingStatus ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Reject Complaint
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
