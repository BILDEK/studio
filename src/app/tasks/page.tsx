"use client";

import { useState, useEffect } from "react";
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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sampleTasks } from "@/lib/sample-data";

import { AppLayout } from "@/components/app-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createTaskAssignedNotification, createTaskStatusChangedNotification } from "@/lib/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusCircle, MoreHorizontal, Edit, Trash2, Search, Filter, X } from "lucide-react";
import { AddTaskForm, TaskFormValues } from "@/components/add-task-form";
import { EditTaskForm } from "@/components/edit-task-form";
import type { Employee } from "@/app/employees/page";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TaskStatus = "todo" | "inProgress" | "done";

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignee: string;
  assigneeId?: string;
  dueDate: Date;
  priority: "High" | "Medium" | "Low";
  avatar: string;
  status: TaskStatus;
}

const tasksCollectionRef = collection(db, "tasks");
const employeesCollectionRef = collection(db, "employees");

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "High":
      return <Badge variant="destructive">High</Badge>;
    case "Medium":
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-500/80">Medium</Badge>
      );
    case "Low":
      return <Badge variant="secondary">Low</Badge>;
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Filter states
  const [searchText, setSearchText] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [dueDateFilter, setDueDateFilter] = useState("all");

  const fetchTasksAndEmployees = async () => {
    setIsLoading(true);
    try {
      // Fetch employees
      const employeeSnapshot = await getDocs(employeesCollectionRef);
      const employeesData = employeeSnapshot.docs.map(
        (doc) => ({ ...doc.data(), id: doc.id }) as Employee,
      );
      setEmployees(employeesData);

      // Fetch tasks
      const taskSnapshot = await getDocs(
        query(tasksCollectionRef, orderBy("dueDate", "desc")),
      );
      if (taskSnapshot.empty && employeesData.length > 0) {
        // Populate with sample data if empty
        const batch = writeBatch(db);
        sampleTasks.forEach((task) => {
          const assignee = employeesData.find((e) => e.name === task.assignee);
          const newDocRef = doc(tasksCollectionRef);
          batch.set(newDocRef, {
            ...task,
            assigneeId: assignee?.id || "",
            dueDate: Timestamp.fromDate(task.dueDate as Date),
          });
        });
        await batch.commit();
        await fetchTasksAndEmployees(); // Refetch after populating
        return;
      }

      const tasksData = taskSnapshot.docs.map((doc) => {
        const data = doc.data();
        const assignee = employeesData.find((e) => e.id === data.assigneeId);
        return {
          ...data,
          id: doc.id,
          dueDate: (data.dueDate as Timestamp).toDate(),
          // Add assignee details for rendering
          assignee: assignee?.name || data.assignee,
          avatar: assignee?.avatar || data.avatar,
        } as Task;
      });
      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndEmployees();
  }, []);

  const handleAddTask = async (taskData: TaskFormValues) => {
    const assignee = employees.find((e) => e.id === taskData.assigneeId);
    if (!assignee) {
      console.error("Assignee not found");
      return;
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
      };
      await addDoc(tasksCollectionRef, newTask);
      
      await createTaskAssignedNotification(
        assignee.email,
        assignee.name,
        taskData.title,
        "System"
      );
      
      fetchTasksAndEmployees();
      setIsAddOpen(false);
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleEditTask = async (taskId: string, taskData: TaskFormValues) => {
    const assignee = employees.find((e) => e.id === taskData.assigneeId);
    if (!assignee) {
      console.error("Assignee not found");
      return;
    }

    try {
      const taskDoc = doc(db, "tasks", taskId);
      const updatedTask = {
        title: taskData.title,
        description: taskData.description,
        assignee: assignee.name,
        assigneeId: assignee.id,
        avatar: assignee.avatar,
        dueDate: Timestamp.fromDate(new Date(taskData.dueDate)),
        priority: taskData.priority,
      };
      await updateDoc(taskDoc, updatedTask);
      fetchTasksAndEmployees();
      setIsEditOpen(false);
    } catch (error) {
      console.error("Error editing task: ", error);
    }
  };

  const handleUpdateStatus = async (taskId: string, status: TaskStatus) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const taskDoc = doc(db, "tasks", taskId);
      await updateDoc(taskDoc, { status });
      
      const assignee = employees.find(e => e.id === task.assigneeId);
      if (assignee) {
        await createTaskStatusChangedNotification(
          assignee.email,
          assignee.name,
          task.title,
          status
        );
      }
      
      fetchTasksAndEmployees();
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    try {
      await deleteDoc(doc(db, "tasks", selectedTask.id));
      fetchTasksAndEmployees();
      setIsDeleteAlertOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Filter logic functions
  const isOverdue = (dueDate: Date) => {
    return new Date(dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
  };

  const isToday = (dueDate: Date) => {
    const today = new Date();
    const taskDate = new Date(dueDate);
    return taskDate.toDateString() === today.toDateString();
  };

  const isThisWeek = (dueDate: Date) => {
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const taskDate = new Date(dueDate);
    return taskDate >= weekStart && taskDate <= weekEnd;
  };

  const filterTasks = (tasks: Task[], status: TaskStatus) => {
    let filtered = tasks.filter((task) => task.status === status);
    
    // Apply search filter
    if (searchText.trim() !== "") {
      const search = searchText.toLowerCase().trim();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(search) ||
          (task.description && task.description.toLowerCase().includes(search))
      );
    }
    
    // Apply priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => task.priority === priorityFilter);
    }
    
    // Apply assignee filter
    if (assigneeFilter !== "all") {
      filtered = filtered.filter((task) => task.assigneeId === assigneeFilter);
    }
    
    // Apply due date filter
    if (dueDateFilter !== "all") {
      switch (dueDateFilter) {
        case "overdue":
          filtered = filtered.filter((task) => isOverdue(task.dueDate));
          break;
        case "today":
          filtered = filtered.filter((task) => isToday(task.dueDate));
          break;
        case "thisWeek":
          filtered = filtered.filter((task) => isThisWeek(task.dueDate));
          break;
      }
    }
    
    return filtered;
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchText("");
    setPriorityFilter("all");
    setAssigneeFilter("all");
    setDueDateFilter("all");
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      searchText.trim() !== "" ||
      priorityFilter !== "all" ||
      assigneeFilter !== "all" ||
      dueDateFilter !== "all"
    );
  };

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
                  setSelectedTask(task);
                  setIsEditOpen(true);
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
                  setSelectedTask(task);
                  setIsDeleteAlertOpen(true);
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
              <AvatarFallback>
                {typeof task.assignee === "string" && task.assignee.length > 0
                  ? task.assignee.charAt(0)
                  : "?"}
              </AvatarFallback>
            </Avatar>
            <span>{task.assignee || "Unknown"}</span>
          </div>
          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
        </div>
      </CardContent>
      <CardFooter className="py-2">
        {getPriorityBadge(task.priority)}
      </CardFooter>
    </Card>
  );

  const renderTaskColumn = (status: TaskStatus, title: string) => {
    const filteredTasks = filterTasks(tasks, status);
    return (
      <TabsContent value={status} className="mt-4">
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
            {hasActiveFilters() 
              ? `No tasks matching the current filters in "${title}".`
              : `No tasks in "${title}".`
            }
          </div>
        )}
      </TabsContent>
    );
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <Button onClick={() => setIsAddOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </div>

        {/* Filter Controls */}
        <Card className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <h3 className="text-sm font-medium">Filters</h3>
              {hasActiveFilters() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="ml-auto"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Search Filter */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Priority Filter */}
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="High">High Priority</SelectItem>
                  <SelectItem value="Medium">Medium Priority</SelectItem>
                  <SelectItem value="Low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Assignee Filter */}
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Due Date Filter */}
              <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Due Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Due Dates</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="today">Due Today</SelectItem>
                  <SelectItem value="thisWeek">Due This Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Active Filters Display */}
            {hasActiveFilters() && (
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span>Active filters:</span>
                {searchText.trim() && (
                  <Badge variant="secondary">Search: "{searchText.trim()}"</Badge>
                )}
                {priorityFilter !== "all" && (
                  <Badge variant="secondary">Priority: {priorityFilter}</Badge>
                )}
                {assigneeFilter !== "all" && (
                  <Badge variant="secondary">
                    Assignee: {employees.find(e => e.id === assigneeFilter)?.name || assigneeFilter}
                  </Badge>
                )}
                {dueDateFilter !== "all" && (
                  <Badge variant="secondary">
                    Due: {dueDateFilter === "overdue" ? "Overdue" : 
                          dueDateFilter === "today" ? "Today" : 
                          dueDateFilter === "thisWeek" ? "This Week" : dueDateFilter}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </Card>

        <Tabs defaultValue="todo" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="todo">To Do</TabsTrigger>
            <TabsTrigger value="inProgress">In Progress</TabsTrigger>
            <TabsTrigger value="done">Done</TabsTrigger>
          </TabsList>

          {/* HATALI SARICI DIV'LER KALDIRILDI */}
          {renderTaskColumn("todo", "To Do")}
          {renderTaskColumn("inProgress", "In Progress")}
          {renderTaskColumn("done", "Done")}
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
                  This action cannot be undone. This will permanently delete the
                  task "{selectedTask.title}".
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
  );
}
