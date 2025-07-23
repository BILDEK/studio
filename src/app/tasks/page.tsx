
"use client"

import { useState, useEffect } from "react"
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { sampleTasks } from "@/lib/sample-data"

import { AppLayout } from "@/components/app-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PlusCircle, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { AddTaskForm, TaskFormValues } from "@/components/add-task-form"
import { EditTaskForm } from "@/components/edit-task-form"
import type { Employee } from "@/app/employees/page"

export type TaskStatus = "todo" | "inProgress" | "done"

export interface Task {
  id: string
  title: string
  description?: string
  assignee: string
  assigneeId?: string
  dueDate: Date
  priority: "High" | "Medium" | "Low"
  avatar: string
  status: TaskStatus
}

const tasksCollectionRef = collection(db, "tasks")
const employeesCollectionRef = collection(db, "employees")

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "High":
      return <Badge variant="destructive">High</Badge>
    case "Medium":
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-500/80">Medium</Badge>
      )
    case "Low":
      return <Badge variant="secondary">Low</Badge>
    default:
      return <Badge variant="outline">{priority}</Badge>
  }
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const fetchTasksAndEmployees = async () => {
    setIsLoading(true)
    try {
      // Fetch employees
      const employeeSnapshot = await getDocs(employeesCollectionRef)
      const employeesData = employeeSnapshot.docs.map(
        (doc) => ({ ...doc.data(), id: doc.id } as Employee)
      )
      setEmployees(employeesData)

      // Fetch tasks
      const taskSnapshot = await getDocs(query(tasksCollectionRef, orderBy("dueDate", "desc")))
      if (taskSnapshot.empty && employeesData.length > 0) {
        // Populate with sample data if empty
        const batch = writeBatch(db)
        sampleTasks.forEach((task) => {
          const assignee = employeesData.find(e => e.name === task.assignee)
          const newDocRef = doc(tasksCollectionRef)
          batch.set(newDocRef, {
            ...task,
            assigneeId: assignee?.id || "",
            dueDate: Timestamp.fromDate(task.dueDate as Date),
          })
        })
        await batch.commit()
        await fetchTasksAndEmployees() // Refetch after populating
        return
      }

      const tasksData = taskSnapshot.docs.map((doc) => {
        const data = doc.data()
        const assignee = employeesData.find(e => e.id === data.assigneeId);
        return {
          ...data,
          id: doc.id,
          dueDate: (data.dueDate as Timestamp).toDate(),
          // Add assignee details for rendering
          assignee: assignee?.name || data.assignee,
          avatar: assignee?.avatar || data.avatar,
        } as Task
      })
      setTasks(tasksData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTasksAndEmployees()
  }, [])

  const handleAddTask = async (taskData: TaskFormValues) => {
    const assignee = employees.find((e) => e.id === taskData.assigneeId)
    if (!assignee) {
      console.error("Assignee not found")
      return
    }

    try {
      const newTask = {
        title: taskData.title,
        description: taskData.description,
        assignee: assignee.name,
        assigneeId: assignee.id,
        avatar: assignee.avatar,
        dueDate: Timestamp.fromDate(new Date(taskData.dueDate)),
        priority: taskData.priority,
        status: "todo",
      }
      await addDoc(tasksCollectionRef, newTask)
      fetchTasksAndEmployees()
      setIsAddOpen(false)
    } catch (error) {
      console.error("Error adding task:", error)
    }
  }

  const handleEditTask = async (taskId: string, taskData: TaskFormValues) => {
     const assignee = employees.find((e) => e.id === taskData.assigneeId)
    if (!assignee) {
      console.error("Assignee not found")
      return
    }
    
    try {
        const taskDoc = doc(db, "tasks", taskId)
        const updatedTask = {
            title: taskData.title,
            description: taskData.description,
            assignee: assignee.name,
            assigneeId: assignee.id,
            avatar: assignee.avatar,
            dueDate: Timestamp.fromDate(new Date(taskData.dueDate)),
            priority: taskData.priority,
        }
        await updateDoc(taskDoc, updatedTask);
        fetchTasksAndEmployees();
        setIsEditOpen(false);
    } catch (error) {
        console.error("Error editing task: ", error)
    }
  }

  const handleUpdateStatus = async (taskId: string, status: TaskStatus) => {
    try {
      const taskDoc = doc(db, "tasks", taskId)
      await updateDoc(taskDoc, { status })
      fetchTasksAndEmployees()
    } catch (error) {
      console.error("Error updating task status:", error)
    }
  }
  
  const handleDeleteTask = async () => {
    if (!selectedTask) return
    try {
      await deleteDoc(doc(db, "tasks", selectedTask.id))
      fetchTasksAndEmployees()
      setIsDeleteAlertOpen(false)
      setSelectedTask(null)
    } catch (error) {
        console.error("Error deleting task:", error)
    }
  }

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-medium leading-tight">
            {task.title}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 -mr-2 -mt-2"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onSelect={() => {
                  setSelectedTask(task)
                  setIsEditOpen(true)
                }}
              >
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onClick={() => handleUpdateStatus(task.id, "todo")}
                    >
                      To Do
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleUpdateStatus(task.id, "inProgress")}
                    >
                      In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleUpdateStatus(task.id, "done")}
                    >
                      Done
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onSelect={() => {
                  setSelectedTask(task)
                  setIsDeleteAlertOpen(true)
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="py-2 flex-grow">
        {task.description && (
            <CardDescription className="text-sm mb-3 text-foreground/80">
                {task.description}
            </CardDescription>
        )}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={task.avatar} data-ai-hint="profile picture" />
              <AvatarFallback>{typeof task.assignee === 'string' && task.assignee.length > 0 ? task.assignee.charAt(0) : '?'}</AvatarFallback>
            </Avatar>
            <span>{task.assignee || 'Unknown'}</span>
          </div>
          <span>
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
      <CardFooter className="py-2">
        {getPriorityBadge(task.priority)}
      </CardFooter>
    </Card>
  )

  const renderTaskColumn = (status: TaskStatus, title: string) => {
    const filteredTasks = tasks.filter((task) => task.status === status)
    return (
      <TabsContent value={status}>
        {isLoading ? (
            <div className="text-center p-8">Loading tasks...</div>
        ) : filteredTasks.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground p-8">
            No tasks in "{title}".
          </div>
        )}
      </TabsContent>
    )
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <Button onClick={() => setIsAddOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </div>

        <Tabs defaultValue="todo" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="todo">To Do</TabsTrigger>
            <TabsTrigger value="inProgress">In Progress</TabsTrigger>
            <TabsTrigger value="done">Done</TabsTrigger>
          </TabsList>
          <div className="overflow-x-auto w-full">
            <div className="min-w-[320px] flex flex-col gap-4 md:grid md:gap-4 md:grid-cols-2 lg:grid-cols-3">
              {renderTaskColumn("todo", "To Do")}
              {renderTaskColumn("inProgress", "In Progress")}
              {renderTaskColumn("done", "Done")}
            </div>
          </div>
        </Tabs>
      </div>
      
      <AddTaskForm
        isOpen={isAddOpen}
        onOpenChange={setIsAddOpen}
        onAddTask={handleAddTask}
        employees={employees}
      />

      {selectedTask && (
        <>
            <EditTaskForm
                isOpen={isEditOpen}
                onOpenChange={setIsEditOpen}
                onEditTask={handleEditTask}
                employees={employees}
                task={selectedTask}
            />
            <AlertDialog
                open={isDeleteAlertOpen}
                onOpenChange={setIsDeleteAlertOpen}
            >
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the task "{selectedTask.title}".
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                    onClick={handleDeleteTask}
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
