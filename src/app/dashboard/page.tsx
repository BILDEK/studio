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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import type { ChartConfig } from "@/components/ui/chart"
import { Boxes, ListTodo, Users } from "lucide-react"
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        // Employees
        const employeesCollectionRef = collection(typedDb, "employees")
        const employeesSnapshot = await getDocs(employeesCollectionRef)
        setEmployeeCount(employeesSnapshot.size)

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
        const now = new Date()
        tasksSnapshot.forEach(doc => {
          const data = doc.data()
          if (data.status === "open") openTasks++
          if (data.dueDate && data.status === "open" && data.dueDate.toDate?.() < now) overdueTasks++
        })
        setOpenTasksCount(openTasks)
        setTotalTasksCount(tasksSnapshot.size)
        setOverdueTasksCount(overdueTasks)

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Skeletons for loading state */}
          {loading ? (
            <>
              {[...Array(3)].map((_, i) => (
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
                  <CardTitle className="text-sm font-medium">Employees</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{employeeCount ?? '-'}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {recentEmployee ? `Last added: ${recentEmployee.name} (${recentEmployee.addedAgo})` : '-'}
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
                  <CardTitle className="text-sm font-medium">Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalTasksCount !== null ? totalTasksCount : '-'}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {openTasksCount !== null ? `${openTasksCount} open` : 'Loading...'}<br />
                    {overdueTasksCount !== null ? `${overdueTasksCount} overdue` : ''}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Task Completion Overview</CardTitle>
              <CardDescription>
                Number of tasks completed per month.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                <BarChart accessibilityLayer data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                   <YAxis />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="tasks" fill="var(--color-tasks)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
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
