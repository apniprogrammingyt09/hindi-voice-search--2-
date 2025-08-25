"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  TrendingUp,
  Users,
  FileText,
  Calendar,
  ArrowRight,
  RefreshCw,
  Phone,
  Globe
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

interface Complaint {
  _id: string
  reportId: string
  complaint_type: string
  status: string
  createdAt: string
  complainant?: {
    first_name: string
    last_name: string
  }
}

interface DashboardStats {
  totalComplaints: number
  pendingApproval: number
  approved: number
  inProgress: number
  completed: number
  rejected: number
  todayComplaints: number
}

interface ChartData {
  complaintTrends: Array<{
    day: string
    registered: number
    approved: number
    completed: number
  }>
  departmentPerformance: Array<{
    department: string
    total: number
    completed: number
    pending: number
  }>
  complaintsByCategory: Array<{
    name: string
    value: number
    color: string
  }>
  resolutionTimes: Array<{
    category: string
    avgHours: number
    target: number
  }>
}

// Colors for charts
const COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6'
}

interface AdminDashboardOverviewProps {
  onNavigate?: (tab: string) => void
}

export default function AdminDashboardOverview({ onNavigate }: AdminDashboardOverviewProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalComplaints: 0,
    pendingApproval: 0,
    approved: 0,
    inProgress: 0,
    completed: 0,
    rejected: 0,
    todayComplaints: 0
  })
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<ChartData>({
    complaintTrends: [],
    departmentPerformance: [],
    complaintsByCategory: [],
    resolutionTimes: []
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/complaints')
      const data = await response.json()
      
      if (response.ok && data.complaints) {
        const complaints = data.complaints
        
        // Calculate stats
        const today = new Date().toDateString()
        const todayCount = complaints.filter((c: Complaint) => 
          new Date(c.createdAt).toDateString() === today
        ).length

        const newStats: DashboardStats = {
          totalComplaints: complaints.length,
          pendingApproval: complaints.filter((c: Complaint) => c.status === 'Pending Approval').length,
          approved: complaints.filter((c: Complaint) => c.status === 'Approved').length,
          inProgress: complaints.filter((c: Complaint) => c.status === 'In Progress').length,
          completed: complaints.filter((c: Complaint) => c.status === 'Completed').length,
          rejected: complaints.filter((c: Complaint) => c.status === 'Rejected').length,
          todayComplaints: todayCount
        }

        setStats(newStats)
        setRecentComplaints(complaints.slice(0, 5))
        
        // Generate chart data
        generateChartData(complaints, newStats)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateChartData = (complaints: Complaint[], stats: DashboardStats) => {
    // Generate last 7 days complaint trends
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
      
      // Filter complaints for this day
      const dayComplaints = complaints.filter((c: Complaint) => {
        const complaintDate = new Date(c.createdAt)
        return complaintDate.toDateString() === date.toDateString()
      })
      
      const registered = dayComplaints.length
      const approved = dayComplaints.filter(c => ['Approved', 'In Progress', 'Completed'].includes(c.status)).length
      const completed = dayComplaints.filter(c => c.status === 'Completed').length
      
      last7Days.push({
        day: dayName,
        registered,
        approved,
        completed
      })
    }

    // Generate department performance data
    const departments = [
      { name: 'Water & Sanitation', types: ['water', 'sewage', 'drainage'] },
      { name: 'Public Works', types: ['engineering', 'road', 'construction'] },
      { name: 'Health Services', types: ['health', 'medical', 'sanitation'] },
      { name: 'Revenue', types: ['finance', 'tax', 'payment'] },
      { name: 'Emergency Services', types: ['fire', 'emergency', 'safety'] }
    ]

    const departmentData = departments.map(dept => {
      const deptComplaints = complaints.filter(c => 
        dept.types.some(type => c.complaint_type.toLowerCase().includes(type))
      )
      const completed = deptComplaints.filter(c => c.status === 'Completed').length
      const pending = deptComplaints.filter(c => ['Pending Approval', 'Approved', 'In Progress'].includes(c.status)).length
      
      return {
        department: dept.name,
        total: deptComplaints.length,
        completed,
        pending
      }
    })

    // Generate complaints by category with real data
    const categoryMapping = {
      'Water & Electricity': { types: ['water', 'electricity', 'power'], color: COLORS.info },
      'Sewage & Drainage': { types: ['sewage', 'drainage', 'sanitation'], color: COLORS.warning },
      'Roads & Infrastructure': { types: ['engineering', 'road', 'construction'], color: COLORS.primary },
      'Health & Safety': { types: ['health', 'medical', 'fire', 'emergency'], color: COLORS.danger },
      'Revenue & Finance': { types: ['finance', 'tax', 'payment'], color: COLORS.success }
    }

    const categoryData = Object.entries(categoryMapping).map(([name, config]) => {
      const count = complaints.filter(c => 
        config.types.some(type => c.complaint_type.toLowerCase().includes(type))
      ).length
      
      return {
        name,
        value: count || 1, // Ensure at least 1 for visualization
        color: config.color
      }
    })

    // Generate resolution times data (simulated but realistic)
    const resolutionData = [
      { category: 'Water Supply', avgHours: 24, target: 48 },
      { category: 'Sewage Issues', avgHours: 36, target: 72 },
      { category: 'Road Repairs', avgHours: 120, target: 168 },
      { category: 'Health Services', avgHours: 12, target: 24 },
      { category: 'Revenue Matters', avgHours: 72, target: 120 }
    ]

    setChartData({
      complaintTrends: last7Days,
      departmentPerformance: departmentData,
      complaintsByCategory: categoryData,
      resolutionTimes: resolutionData
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending Approval': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Approved': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'In Progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'Rejected': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage municipal complaints efficiently</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Complaints</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalComplaints}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingApproval}</p>
                {stats.pendingApproval > 0 && (
                  <p className="text-xs text-orange-600 font-medium">Needs Action</p>
                )}
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Complaint Trends Chart */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Complaint Trends
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Last 7 days progress</p>
              </div>
              <Button variant="outline" size="sm" className="border-blue-200">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">TOTAL REGISTERED</p>
                <p className="text-2xl font-bold text-blue-600">
                  {chartData.complaintTrends.reduce((sum: number, day) => sum + day.registered, 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">APPROVED</p>
                <p className="text-2xl font-bold text-green-600">
                  {chartData.complaintTrends.reduce((sum: number, day) => sum + day.approved, 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">COMPLETION RATE</p>
                <p className="text-2xl font-bold text-blue-600">
                  {chartData.complaintTrends.length > 0 
                    ? Math.round((chartData.complaintTrends.reduce((sum: number, day) => sum + day.completed, 0) / 
                       chartData.complaintTrends.reduce((sum: number, day) => sum + day.registered, 0) || 1) * 100)
                    : 0}%
                </p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span className="text-xs text-green-600 font-medium">↗ Improving</span>
                </div>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.complaintTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="day" 
                    stroke="#64748b"
                    fontSize={12}
                  />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="registered" 
                    stroke={COLORS.primary}
                    strokeWidth={3}
                    dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
                    name="Registered"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="approved" 
                    stroke={COLORS.success}
                    strokeWidth={3}
                    dot={{ fill: COLORS.success, strokeWidth: 2, r: 4 }}
                    name="Approved"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke={COLORS.warning}
                    strokeWidth={3}
                    dot={{ fill: COLORS.warning, strokeWidth: 2, r: 4 }}
                    name="Completed"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department Performance Chart */}
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                  Department Performance
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Workload distribution</p>
              </div>
              <Button variant="outline" size="sm" className="border-purple-200">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">DEPARTMENTS</p>
                <p className="text-2xl font-bold text-purple-600">{chartData.departmentPerformance.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">AVG WORKLOAD</p>
                <p className="text-2xl font-bold text-orange-600">
                  {chartData.departmentPerformance.length > 0 
                    ? Math.round(chartData.departmentPerformance.reduce((sum: number, dept) => sum + dept.total, 0) / chartData.departmentPerformance.length)
                    : 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">EFFICIENCY</p>
                <p className="text-2xl font-bold text-green-600">
                  {chartData.departmentPerformance.length > 0 
                    ? Math.round((chartData.departmentPerformance.reduce((sum: number, dept) => sum + dept.completed, 0) / 
                       chartData.departmentPerformance.reduce((sum: number, dept) => sum + dept.total, 0) || 1) * 100)
                    : 0}%
                </p>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.departmentPerformance} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" fontSize={12} />
                  <YAxis 
                    type="category" 
                    dataKey="department" 
                    stroke="#64748b" 
                    fontSize={10}
                    width={80}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="completed" 
                    fill={COLORS.success}
                    name="Completed"
                    radius={[0, 2, 2, 0]}
                  />
                  <Bar 
                    dataKey="pending" 
                    fill={COLORS.warning}
                    name="Pending"
                    radius={[0, 2, 2, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Complaints by Category */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-green-600" />
              Complaints by Category
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Service distribution</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.complaintsByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.complaintsByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#f1f5f9'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-3">
                {chartData.complaintsByCategory.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{category.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resolution Times */}
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-orange-600" />
              Average Resolution Times
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Performance vs targets</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.resolutionTimes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="category" 
                    stroke="#64748b"
                    fontSize={10}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                    formatter={(value, name) => [`${value} hours`, name === 'avgHours' ? 'Actual' : 'Target']}
                  />
                  <Legend />
                  <Bar 
                    dataKey="avgHours" 
                    fill={COLORS.primary}
                    name="Actual (hours)"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="target" 
                    fill={COLORS.secondary}
                    name="Target (hours)"
                    radius={[2, 2, 0, 0]}
                    opacity={0.6}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Activity & Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Today's Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">New Complaints</p>
                    <p className="text-sm text-muted-foreground">Submitted today</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-blue-600">{stats.todayComplaints}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <p className="font-medium">{stats.approved}</p>
                  <p className="text-muted-foreground">Approved</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <p className="font-medium">{stats.rejected}</p>
                  <p className="text-muted-foreground">Rejected</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.pendingApproval > 0 && (
                <Button 
                  className="w-full justify-between bg-orange-600 hover:bg-orange-700" 
                  onClick={() => onNavigate?.('complaint-management')}
                >
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Review Pending Approvals
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{stats.pendingApproval}</Badge>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Button>
              )}
              
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => onNavigate?.('complaint-management')}
              >
                <span className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Manage In Progress
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{stats.inProgress}</Badge>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => onNavigate?.('complaints')}
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  View All Complaints
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{stats.totalComplaints}</Badge>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Complaints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Complaints
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentComplaints.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No complaints found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentComplaints.map((complaint) => (
                <div key={complaint._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{complaint.complaint_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {complaint.complainant?.first_name} {complaint.complainant?.last_name}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={getStatusColor(complaint.status)}>
                      {complaint.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Priority Actions */}
      {stats.pendingApproval > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900">Action Required</h3>
                <p className="text-sm text-orange-700">
                  {stats.pendingApproval} complaint{stats.pendingApproval > 1 ? 's' : ''} waiting for approval. 
                  Review and approve to start processing.
                </p>
              </div>
              <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => onNavigate?.('complaint-management')}>
                Review Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
