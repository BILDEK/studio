"use client"

import { useState } from "react"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const initialEmployees = [
  {
    name: "Olivia Martin",
    email: "olivia.martin@example.com",
    avatar: "https://placehold.co/100x100/A3E635/4D7C0F.png",
    role: "Project Manager",
    status: "Active",
    lastActivity: "2024-07-29T10:30:00Z",
  },
  {
    name: "Liam Johnson",
    email: "liam.johnson@example.com",
    avatar: "https://placehold.co/100x100/6EE7B7/047857.png",
    role: "Lead Developer",
    status: "Active",
    lastActivity: "2024-07-29T11:05:00Z",
  },
  {
    name: "Emma Williams",
    email: "emma.williams@example.com",
    avatar: "https://placehold.co/100x100/34D399/065F46.png",
    role: "UX Designer",
    status: "On Leave",
    lastActivity: "2024-07-25T14:00:00Z",
  },
  {
    name: "Noah Brown",
    email: "noah.brown@example.com",
    avatar: "https://placehold.co/100x100/A7F3D0/064E3B.png",
    role: "Marketing Specialist",
    status: "Active",
    lastActivity: "2024-07-29T09:15:00Z",
  },
  {
    name: "Ava Jones",
    email: "ava.jones@example.com",
    avatar: "https://placehold.co/100x100/86EFAC/14532D.png",
    role: "Intern",
    status: "Inactive",
    lastActivity: "2024-06-30T17:00:00Z",
  },
]

export type Employee = (typeof initialEmployees)[0]

export default function EmployeesPage() {
  const [employees, setEmployees] = useState(initialEmployees)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isDeactivateAlertOpen, setIsDeactivateAlertOpen] = useState(false)

  const handleAddEmployee = (newEmployeeData: Omit<Employee, 'avatar' | 'status' | 'lastActivity'>) => {
    const newEmployee: Employee = {
      ...newEmployeeData,
      avatar: `https://placehold.co/100x100.png`,
      status: "Active",
      lastActivity: new Date().toISOString(),
    }
    setEmployees((prev) => [newEmployee, ...prev])
  }

  const handleEditEmployee = (
    originalEmail: string,
    updatedData: Omit<Employee, "avatar" | "status" | "lastActivity">
  ) => {
    setEmployees((prev) =>
      prev.map((employee) =>
        employee.email === originalEmail
          ? { ...employee, ...updatedData }
          : employee
      )
    )
  }

  const handleDeactivateEmployee = (email: string) => {
    setEmployees((prev) =>
      prev.map((employee) =>
        employee.email === email
          ? { ...employee, status: "Inactive" }
          : employee
      )
    );
  };

  const handleActivateEmployee = (email: string) => {
    setEmployees((prev) =>
      prev.map((employee) =>
        employee.email === email
          ? { ...employee, status: "Active" }
          : employee
      )
    );
  };


  return (
    <AppLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Employees</h1>
          <AddEmployeeForm onAddEmployee={handleAddEmployee}>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Employee
            </Button>
          </AddEmployeeForm>
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
                {employees.map((employee) => (
                  <TableRow key={employee.email}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={employee.avatar} alt={employee.name} data-ai-hint="profile picture" />
                          <AvatarFallback>
                            {employee.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{employee.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.role}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          employee.status === "Active"
                            ? "default"
                            : employee.status === "Inactive"
                            ? "destructive"
                            : "secondary"
                        }
                        className={
                          employee.status === "Active"
                            ? "bg-primary/20 text-primary-foreground border-primary/20 hover:bg-primary/30"
                            : ""
                        }
                      >
                        {employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(employee.lastActivity).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => {
                              setSelectedEmployee(employee)
                              setIsEditOpen(true)
                            }}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => {
                              setSelectedEmployee(employee)
                              setIsDetailsOpen(true)
                            }}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             {employee.status === 'Inactive' ? (
                                <DropdownMenuItem onClick={() => handleActivateEmployee(employee.email)}>
                                  Activate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onSelect={() => {
                                    setSelectedEmployee(employee)
                                    setIsDeactivateAlertOpen(true)
                                  }}
                                  disabled={employee.status === 'Inactive'}
                                >
                                  Deactivate
                                </DropdownMenuItem>
                              )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

       {selectedEmployee && (
        <>
          <EditEmployeeForm
            employee={{
              name: selectedEmployee.name,
              email: selectedEmployee.email,
              role: selectedEmployee.role,
              originalEmail: selectedEmployee.email,
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
          <AlertDialog open={isDeactivateAlertOpen} onOpenChange={setIsDeactivateAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will mark {selectedEmployee.name} as inactive.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDeactivateEmployee(selectedEmployee.email)}>
                  Deactivate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </AppLayout>
  )
}
