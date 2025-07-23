
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
import { useToast } from "@/hooks/use-toast"

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
      } else {
        setEmployees((prev) => [...prev, ...employeesData]);
      }
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === PAGE_SIZE);
    } catch (error) {
      console.error("Error fetching employees:", error);
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
      fetchEmployees()
      setIsEditOpen(false)
    } catch (error) {
      console.error("Error editing employee:", error)
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
      const employeeDoc = doc(db, "employees", id)
      await updateDoc(employeeDoc, { status })
      fetchEmployees()
    } catch (error) {
      console.error("Error updating status:", error)
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
                      No employees found.
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

    