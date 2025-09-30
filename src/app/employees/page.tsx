
"use client"

import { useState, useEffect, useRef } from "react"
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, writeBatch, Timestamp, query, orderBy, limit, startAfter } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { formatDistanceToNow } from 'date-fns'
import { migrateTest0ToEmployees, deleteDuplicateEmployees } from "@/lib/actions"

import { AppLayout } from "@/components/app-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MoreHorizontal, PlusCircle, Search, ArrowUpDown, X } from "lucide-react"
import { AddEmployeeForm } from "@/components/add-employee-form"
import { EditEmployeeForm } from "@/components/edit-employee-form"
import { EmployeeDetailsDialog } from "@/components/employee-details-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { createEmployeeStatusChangedNotification } from "@/lib/notifications"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface Employee {
  id: string
  name: string
  email: string
  avatar: string
  role: string
  status: "Active" | "On Leave" | "Inactive"
  lastActivity: Date | string
}

const sampleEmployees = [
    {
    name: "Jane Doe",
    email: "jane.doe@example.com",
    role: "Project Manager",
    status: "Active" as const,
    avatar: `https://placehold.co/100x100/A3E635/4D7C0F.png`,
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    name: "John Smith",
    email: "john.smith@example.com",
    role: "Lead Developer",
    status: "Active" as const,
    avatar: `https://placehold.co/100x100/6EE7B7/047857.png`,
    lastActivity: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
  },
  {
    name: "Peter Jones",
    email: "peter.jones@example.com",
    role: "UX Designer",
    status: "On Leave" as const,
    avatar: `https://placehold.co/100x100/34D399/065F46.png`,
    lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    name: "Olivia Martin",
    email: "olivia.martin@example.com",
    role: "Marketing Specialist",
    status: "Active" as const,
    avatar: `https://placehold.co/100x100/A7F3D0/064E3B.png`,
    lastActivity: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
  },
    {
    name: "Noah Brown",
    email: "noah.brown@example.com",
    role: "Intern",
    status: "Inactive" as const,
    avatar: `https://placehold.co/100x100/86EFAC/14532D.png`,
    lastActivity: new Date(Date.now() - 3 * 7 * 24 * 60 * 60 * 1000), // 3 weeks ago
  },
]

const employeesCollectionRef = collection(db, "employees")

export default function EmployeesPage() {
  const { toast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [lastVisible, setLastVisible] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"name" | "role" | "status" | "lastActivity">("lastActivity")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const PAGE_SIZE = 20;
  const loadingRef = useRef(false);

  const fetchEmployees = async (isInitial = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    try {
      let q;
      if (isInitial || !lastVisible) {
        q = query(employeesCollectionRef, orderBy("lastActivity", "desc"), limit(PAGE_SIZE));
      } else {
        q = query(employeesCollectionRef, orderBy("lastActivity", "desc"), startAfter(lastVisible), limit(PAGE_SIZE));
      }
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        if (isInitial) {
          setEmployees([]);
        }
        setHasMore(false);
        setIsLoading(false);
        loadingRef.current = false;
        return;
      }
      const employeesData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          lastActivity: data.lastActivity instanceof Timestamp ? data.lastActivity.toDate() : (data.lastActivity || 'N/A'),
        } as Employee;
      });
      if (isInitial) {
        setEmployees(employeesData);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      } else {
        setEmployees((prev) => [...prev, ...employeesData]);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
      setHasMore(querySnapshot.docs.length === PAGE_SIZE);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Çalışanlar yüklenirken bir hata oluştu.",
      })
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    fetchEmployees(true);
    // eslint-disable-next-line
  }, []);

  // Sonsuz scroll için event listener
  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore || isLoading) return;
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 300
      ) {
        fetchEmployees();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, isLoading, lastVisible]);

  const handleAddEmployee = async (newEmployeeData: Omit<Employee, "id" | "avatar" | "status" | "lastActivity">) => {
    try {
      const employeeToAdd = {
        ...newEmployeeData,
        status: "Active" as const,
        avatar: `https://placehold.co/100x100.png`,
        lastActivity: Timestamp.now(),
      }
      await addDoc(employeesCollectionRef, employeeToAdd)
      fetchEmployees()
      setIsAddOpen(false)
    } catch (error) {
      console.error("Error adding employee:", error)
    }
  }

  const handleEditEmployee = async (id: string, updatedData: Omit<Employee, "id" | "avatar" | "status" | "lastActivity">) => {
    try {
      const employeeDoc = doc(db, "employees", id)
      await updateDoc(employeeDoc, updatedData)
      
      // Mevcut employees listesini güncelleyelim
      setEmployees(prevEmployees => 
        prevEmployees.map(emp => 
          emp.id === id ? { ...emp, ...updatedData } : emp
        )
      )
      
      setIsEditOpen(false)
      toast({
        title: "Başarılı",
        description: "Çalışan bilgileri güncellendi.",
      })
    } catch (error) {
      console.error("Error editing employee:", error)
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Çalışan güncellenirken bir hata oluştu.",
      })
    }
  }

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return
    try {
      const employeeDoc = doc(db, "employees", selectedEmployee.id)
      await deleteDoc(employeeDoc)
      fetchEmployees()
      setIsDeleteAlertOpen(false)
    } catch (error) {
      console.error("Error deleting employee:", error)
    }
  }
  
  const handleDeleteDuplicates = async () => {
    try {
      const result = await deleteDuplicateEmployees();
      toast({
        title: "Success",
        description: result.message,
      });
      fetchEmployees(); // Refresh the list
    } catch (error) {
      console.error("Error deleting duplicates:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete duplicate employees.",
      });
    }
  }

  const handleSetStatus = async (id: string, status: "Active" | "On Leave" | "Inactive") => {
    try {
      const employee = employees.find(emp => emp.id === id)
      if (!employee) return

      const employeeDoc = doc(db, "employees", id)
      await updateDoc(employeeDoc, { status })
      
      // Durum geçmişine kayıt ekle
      const statusHistoryRef = collection(db, "statusHistory")
      await addDoc(statusHistoryRef, {
        employeeId: id,
        employeeName: employee.name,
        previousStatus: employee.status,
        newStatus: status,
        timestamp: Timestamp.now(),
        changedBy: "System"
      })
      
      await createEmployeeStatusChangedNotification(
        employee.email,
        employee.name,
        status
      )
      
      // Mevcut employees listesini güncelleyelim
      setEmployees(prevEmployees => 
        prevEmployees.map(emp => 
          emp.id === id ? { ...emp, status } : emp
        )
      )
      
      toast({
        title: "Başarılı",
        description: `Çalışan durumu "${status}" olarak güncellendi.`,
      })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Durum güncellenirken bir hata oluştu.",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">{status}</Badge>
      case "Inactive":
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200">{status}</Badge>
      case "On Leave":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200">{status}</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatLastActivity = (activity: Date | string) => {
    if (activity instanceof Date) {
      return `${formatDistanceToNow(activity)} ago`
    }
    return activity
  }

  const uniqueRoles = Array.from(new Set(employees.map(emp => emp.role)))

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = 
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter
    const matchesRole = roleFilter === "all" || employee.role === roleFilter
    
    return matchesSearch && matchesStatus && matchesRole
  })

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    let aValue: any = a[sortBy]
    let bValue: any = b[sortBy]

    if (sortBy === "lastActivity") {
      aValue = aValue instanceof Date ? aValue.getTime() : 0
      bValue = bValue instanceof Date ? bValue.getTime() : 0
    } else {
      aValue = String(aValue).toLowerCase()
      bValue = String(bValue).toLowerCase()
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const hasActiveFilters = searchQuery || statusFilter !== "all" || roleFilter !== "all"

  const clearAllFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setRoleFilter("all")
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Employees</h1>
          <div>
            <Button onClick={handleDeleteDuplicates} variant="outline" className="mr-4">
              Delete Duplicates
            </Button>
            <Button onClick={() => migrateTest0ToEmployees()} className="mr-4">
              Migrate Data
            </Button>
            <Button onClick={() => setIsAddOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Employee
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Employee Management</CardTitle>
            <CardDescription>View, manage, and track your team members.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, role, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {uniqueRoles.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Sort by Name</SelectItem>
                    <SelectItem value="role">Sort by Role</SelectItem>
                    <SelectItem value="status">Sort by Status</SelectItem>
                    <SelectItem value="lastActivity">Sort by Activity</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  title={sortOrder === "asc" ? "Ascending" : "Descending"}
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
                {hasActiveFilters && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={clearAllFilters}
                    className="gap-1"
                  >
                    <X className="h-4 w-4" /> Clear
                  </Button>
                )}
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Loading employees...
                    </TableCell>
                  </TableRow>
                ) : sortedEmployees.length > 0 ? (
                  sortedEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={employee.avatar}
                              alt={employee.name}
                              data-ai-hint="profile picture"
                            />
                            <AvatarFallback>
                              {employee.name
                                ? employee.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                : "???"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{employee.name || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">
                              {employee.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.role}</TableCell>
                      <TableCell>{getStatusBadge(employee.status)}</TableCell>
                      <TableCell>{formatLastActivity(employee.lastActivity)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onSelect={() => {
                                setSelectedEmployee(employee)
                                setIsEditOpen(true)
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => {
                                setSelectedEmployee(employee)
                                setIsDetailsOpen(true)
                              }}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                Change Status
                              </DropdownMenuSubTrigger>
                              <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleSetStatus(employee.id, "Active")
                                    }
                                  >
                                    Active
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleSetStatus(employee.id, "On Leave")
                                    }
                                  >
                                    On Leave
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleSetStatus(employee.id, "Inactive")
                                    }
                                  >
                                    Inactive
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuPortal>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={() => {
                                setSelectedEmployee(employee)
                                setIsDeleteAlertOpen(true)
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      {searchQuery ? `No employees found matching "${searchQuery}".` : "No employees found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {hasMore && !isLoading && (
              <div className="flex justify-center mt-4">
                <Button onClick={() => fetchEmployees()} variant="outline">
                  Daha fazla yükle
                </Button>
              </div>
            )} 

          </CardContent>
        </Card>
      </div>
      <AddEmployeeForm
        onAddEmployee={handleAddEmployee}
        isOpen={isAddOpen}
        onOpenChange={setIsAddOpen}
      />

      {selectedEmployee && (
        <>
          <EditEmployeeForm
            employee={{
              id: selectedEmployee.id,
              name: selectedEmployee.name,
              email: selectedEmployee.email,
              role: selectedEmployee.role,
            }}
            onEditEmployee={handleEditEmployee}
            isOpen={isEditOpen}
            onOpenChange={setIsEditOpen}
          />
          <EmployeeDetailsDialog
            employee={selectedEmployee}
            isOpen={isDetailsOpen}
            onOpenChange={setIsDetailsOpen}
          />
          <AlertDialog
            open={isDeleteAlertOpen}
            onOpenChange={setIsDeleteAlertOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete{" "}
                  {selectedEmployee.name}&apos;s account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteEmployee}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </AppLayout>
  )
}

    