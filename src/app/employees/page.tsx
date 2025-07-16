"use client"

import { useState, useEffect } from "react"
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  writeBatch,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

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
import { MoreHorizontal, PlusCircle } from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"

export interface Employee {
  id: string
  name: string
  email: string
  avatar: string
  role: string
  status: "Active" | "On Leave" | "Inactive"
  lastActivity: string | Timestamp | null
}

const sampleEmployees = [
  {
    name: "Jane Doe",
    email: "jane.doe@example.com",
    role: "Project Manager",
    status: "Active",
    avatar: `https://placehold.co/100x100.png`,
    lastActivity: Timestamp.now(),
  },
  {
    name: "John Smith",
    email: "john.smith@example.com",
    role: "Lead Developer",
    status: "Active",
    avatar: `https://placehold.co/100x100.png`,
    lastActivity: Timestamp.now(),
  },
  {
    name: "Peter Jones",
    email: "peter.jones@example.com",
    role: "UX Designer",
    status: "On Leave",
    avatar: `https://placehold.co/100x100.png`,
    lastActivity: Timestamp.now(),
  },
]

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  )
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const seedDatabase = async () => {
    const batch = writeBatch(db)
    sampleEmployees.forEach((employee) => {
      const docRef = doc(collection(db, "test0"))
      batch.set(docRef, employee)
    })
    await batch.commit()
  }

  const fetchEmployees = async () => {
    setIsLoading(true)
    const q = query(collection(db, "test0"))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      await seedDatabase()
      // Refetch after seeding
      const newQuerySnapshot = await getDocs(q);
      const employeesData = newQuerySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name,
          email: data.email,
          avatar: data.avatar || `https://placehold.co/100x100.png`,
          role: data.role,
          status: data.status,
          lastActivity: data.lastActivity,
        }
      }) as Employee[]
      setEmployees(employeesData)
    } else {
      const employeesData = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name,
          email: data.email,
          avatar: data.avatar || `https://placehold.co/100x100.png`,
          role: data.role,
          status: data.status,
          lastActivity: data.lastActivity,
        }
      }) as Employee[]
      setEmployees(employeesData)
    }

    setIsLoading(false)
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const handleAddEmployee = async (
    newEmployeeData: Omit<Employee, "id" | "avatar" | "status" | "lastActivity">
  ) => {
    const newEmployee = {
      ...newEmployeeData,
      avatar: `https://placehold.co/100x100.png`,
      status: "Active",
      lastActivity: Timestamp.now(),
    }
    try {
      await addDoc(collection(db, "test0"), newEmployee)
      fetchEmployees() // Refetch to get the new list with ID
      setIsAddOpen(false)
    } catch (error) {
      console.error("Error adding employee: ", error)
    }
  }

  const handleEditEmployee = async (
    id: string,
    updatedData: Omit<Employee, "id" | "avatar" | "status" | "lastActivity">
  ) => {
    if (!id) return
    const employeeDocRef = doc(db, "test0", id)
    try {
      await updateDoc(employeeDocRef, {
        ...updatedData,
      })
      fetchEmployees()
      setIsEditOpen(false)
    } catch (error) {
      console.error("Error updating employee: ", error)
    }
  }

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return
    try {
      await deleteDoc(doc(db, "test0", selectedEmployee.id))
      fetchEmployees()
      setIsDeleteAlertOpen(false)
    } catch (error) {
      console.error("Error deleting employee: ", error)
    }
  }

  const handleSetStatus = async (
    id: string,
    status: "Active" | "On Leave" | "Inactive"
  ) => {
    const employeeDocRef = doc(db, "test0", id)
    try {
      await updateDoc(employeeDocRef, { status })
      fetchEmployees()
    } catch (error) {
      console.error("Error updating status: ", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
          >
            {status}
          </Badge>
        )
      case "Inactive":
        return (
          <Badge
            variant="destructive"
            className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200"
          >
            {status}
          </Badge>
        )
      case "On Leave":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200">
            {status}
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }
  
  const formatTimestamp = (ts: any) => {
    if (!ts) return 'N/A';
    if (ts instanceof Timestamp) {
      return ts.toDate().toLocaleDateString();
    }
    if (typeof ts === 'string') {
      return new Date(ts).toLocaleDateString();
    }
    return 'Invalid Date';
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Employees</h1>
          <Button onClick={() => setIsAddOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Employee
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Employee Management</CardTitle>
            <CardDescription>
              View, manage, and track your team members.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : employees.length > 0 ? (
                  employees.map((employee) => (
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
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {employee.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.role}</TableCell>
                      <TableCell>{getStatusBadge(employee.status)}</TableCell>
                      <TableCell>
                        {formatTimestamp(employee.lastActivity)}
                      </TableCell>
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
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center"
                    >
                      No employees found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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

    