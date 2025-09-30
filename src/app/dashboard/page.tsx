"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { AppLayout } from "@/components/app-layout"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, Legend } from "recharts"
import type { ChartConfig } from "@/components/ui/chart"
import { Boxes, ListTodo, Users, TrendingUp, AlertCircle } from "lucide-react"
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Firestore } from "firebase/firestore"

const chartData = [
  { month: "January", tasks: 186 },
  { month: "February", tasks: 305 },
  { month: "March", tasks: 237 },
  { month: "April", tasks: 273 },
  { month: "May", tasks: 209 },
  { month: "June", tasks: 214 },
]

const chartConfig = {
  tasks: {
    label: "Tasks",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export default function DashboardPage() {
  const typedDb: Firestore = db as Firestore
  const [employeeCount, setEmployeeCount] = useState<number | null>(null)
  const [recentEmployee, setRecentEmployee] = useState<{ name: string; addedAgo: string } | null>(null)
  const [inventoryCount, setInventoryCount] = useState<number | null>(null)
  const [totalStockCount, setTotalStockCount] = useState<number | null>(null)
  const [openTasksCount, setOpenTasksCount] = useState<number | null>(null)
  const [totalTasksCount, setTotalTasksCount] = useState<number | null>(null)
  const [overdueTasksCount, setOverdueTasksCount] = useState<number | null>(null)
  const [activityLog, setActivityLog] = useState<Array<{ user: string; action: string; time: string }> | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  
  const [taskStatusData, setTaskStatusData] = useState<any[]>([])
  const [employeeStatusData, setEmployeeStatusData] = useState<any[]>([])
  const [taskPriorityData, setTaskPriorityData] = useState<any[]>([])
  const [activeEmployees, setActiveEmployees] = useState<number>(0)
  const [onLeaveEmployees, setOnLeaveEmployees] = useState<number>(0)
  const [inactiveEmployees, setInactiveEmployees] = useState<number>(0)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        // Employees
        const employeesCollectionRef = collection(typedDb, "employees")
        const employeesSnapshot = await getDocs(employeesCollectionRef)
        setEmployeeCount(employeesSnapshot.size)
        
        let active = 0
        let onLeave = 0
        let inactive = 0
        employeesSnapshot.forEach(doc => {
          const data = doc.data()
          if (data.status === "Active") active++
          if (data.status === "On Leave") onLeave++
          if (data.status === "Inactive") inactive++
        })
        
        setActiveEmployees(active)
        setOnLeaveEmployees(onLeave)
        setInactiveEmployees(inactive)
        
        setEmployeeStatusData([
          { name: "Active", value: active, fill: "#10b981" },
          { name: "On Leave", value: onLeave, fill: "#f59e0b" },
          { name: "Inactive", value: inactive, fill: "#ef4444" }
        ])

        // Son eklenen çalışan (timestamp ile)
        const recentEmployeeQuery = query(employeesCollectionRef, orderBy("lastActivity", "desc"), limit(1))
        const recentEmployeeSnapshot = await getDocs(recentEmployeeQuery)
        if (!recentEmployeeSnapshot.empty) {
          const docData = recentEmployeeSnapshot.docs[0].data()
          const name = docData.name || "Unknown"
          const lastActivity = docData.lastActivity?.toDate?.() || new Date()
          const now = new Date()
          const diffMs = now.getTime() - lastActivity.getTime()
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
          let addedAgo = "today"
          if (diffDays >= 30) {
            addedAgo = `${Math.floor(diffDays / 30)} months ago`
          } else if (diffDays > 0) {
            addedAgo = `${diffDays} days ago`
          }
          setRecentEmployee({ name, addedAgo })
        }

        // Inventory
        const inventoryCollectionRef = collection(typedDb, "inventory")
        const inventorySnapshot = await getDocs(inventoryCollectionRef)
        setInventoryCount(inventorySnapshot.size)
        // Toplam stoktaki ürün sayısı
        let totalStock = 0
        inventorySnapshot.forEach(doc => {
          if (typeof doc.data().stock === 'number') totalStock += doc.data().stock
        })
        setTotalStockCount(totalStock)

        // Tasks
        const tasksCollectionRef = collection(typedDb, "tasks")
        const tasksSnapshot = await getDocs(tasksCollectionRef)
        let openTasks = 0
        let overdueTasks = 0
        let todoCount = 0
        let inProgressCount = 0
        let doneCount = 0
        let highPriority = 0
        let mediumPriority = 0
        let lowPriority = 0
        const now = new Date()
        
        tasksSnapshot.forEach(doc => {
          const data = doc.data()
          if (data.status === "todo") todoCount++
          if (data.status === "inProgress") inProgressCount++
          if (data.status === "done") doneCount++
          if (data.status !== "done") openTasks++
          if (data.dueDate && data.status !== "done" && data.dueDate.toDate?.() < now) overdueTasks++
          
          if (data.priority === "High") highPriority++
          if (data.priority === "Medium") mediumPriority++
          if (data.priority === "Low") lowPriority++
        })
        
        setOpenTasksCount(openTasks)
        setTotalTasksCount(tasksSnapshot.size)
        setOverdueTasksCount(overdueTasks)
        
        setTaskStatusData([
          { name: "To Do", value: todoCount, fill: "#3b82f6" },
          { name: "In Progress", value: inProgressCount, fill: "#f59e0b" },
          { name: "Done", value: doneCount, fill: "#10b981" }
        ])
        
        setTaskPriorityData([
          { name: "High", value: highPriority, fill: "#ef4444" },
          { name: "Medium", value: mediumPriority, fill: "#f59e0b" },
          { name: "Low", value: lowPriority, fill: "#6b7280" }
        ])

        // Recent Activity (from 'activity' collection)
        const activityCollectionRef = collection(typedDb, "activity")
        const activityQuery = query(activityCollectionRef, orderBy("timestamp", "desc"), limit(5))
        const activitySnapshot = await getDocs(activityQuery)
        const log: Array<{ user: string; action: string; time: string }> = []
        const nowTime = new Date().getTime()
        activitySnapshot.forEach(doc => {
          const data = doc.data()
          const user = data.user || "Unknown"
          const action = data.action || "-"
          let time = "just now"
          if (data.timestamp?.toDate) {
            const ts = data.timestamp.toDate()
            const diffMs = nowTime - ts.getTime()
            if (diffMs < 60 * 1000) time = `${Math.floor(diffMs / 1000)}s ago`
            else if (diffMs < 60 * 60 * 1000) time = `${Math.floor(diffMs / (60 * 1000))}m ago`
            else if (diffMs < 24 * 60 * 60 * 1000) time = `${Math.floor(diffMs / (60 * 60 * 1000))}h ago`
            else time = `${Math.floor(diffMs / (24 * 60 * 60 * 1000))}d ago`
          }
          log.push({ user, action, time })
        })
        setActivityLog(log)
      } catch (error) {
        setEmployeeCount(null)
        setRecentEmployee(null)
        setInventoryCount(null)
        setOpenTasksCount(null)
        setOverdueTasksCount(null)
        setActivityLog(null)
        toast({ title: "Dashboard Error", description: "Veriler alınırken bir hata oluştu.", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Skeletons for loading state */}
          {loading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium bg-gray-200 rounded animate-pulse w-24 h-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold bg-gray-200 rounded animate-pulse w-16 h-8" />
                    <p className="text-xs text-muted-foreground mt-1 bg-gray-200 rounded animate-pulse w-32 h-4" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{employeeCount ?? '-'}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeEmployees} active • {onLeaveEmployees} on leave
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Boxes className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Inventory</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalStockCount !== null ? totalStockCount : '-'}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {inventoryCount !== null ? `${inventoryCount} product types` : 'Loading...'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <ListTodo className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalTasksCount !== null ? totalTasksCount : '-'}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {openTasksCount !== null ? `${openTasksCount} open tasks` : 'Loading...'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{overdueTasksCount !== null ? overdueTasksCount : '-'}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requires immediate attention
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Task Status Distribution</CardTitle>
              <CardDescription>Current status of all tasks</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employee Status</CardTitle>
              <CardDescription>Current employee availability</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <PieChart>
                  <Pie
                    data={employeeStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {employeeStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Task Priority</CardTitle>
              <CardDescription>Priority distribution of tasks</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <PieChart>
                  <Pie
                    data={taskPriorityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {taskPriorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                A log of recent activities in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(4)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="bg-gray-200 rounded animate-pulse w-24 h-4" />
                        <TableCell className="bg-gray-200 rounded animate-pulse w-32 h-4" />
                        <TableCell className="bg-gray-200 rounded animate-pulse w-16 h-4" />
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLog && activityLog.length > 0 ? (
                      activityLog.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.user}</TableCell>
                          <TableCell>{item.action}</TableCell>
                          <TableCell>{item.time}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">No recent activity found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
