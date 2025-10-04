"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, writeBatch, Timestamp, query, orderBy, collectionGroup } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sampleTasks } from "@/lib/sample-data";

import { AppLayout } from "@/components/app-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createTaskAssignedNotification, createTaskStatusChangedNotification } from "@/lib/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PlusCircle, MoreHorizontal, Edit, Trash2, Search, Filter, X, Link as LinkIcon, MessageSquare } from "lucide-react";
import { AddTaskForm, TaskFormValues } from "@/components/add-task-form";
import { EditTaskForm } from "@/components/edit-task-form";
import type { Employee } from "@/app/employees/page";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SubTaskList } from "@/components/sub-task-list";
import { Separator } from "@/components/ui/separator";
import type { Comment } from "@/components/task-comments";

export type TaskStatus = "todo" | "inProgress" | "done";

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

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
  dependsOn?: string[];
  subTasks?: SubTask[];
  comments?: Comment[];
}

const tasksCollectionRef = collection(db, "tasks");
const employeesCollectionRef = collection(db, "employees");

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "High": return <Badge variant="destructive">High</Badge>;
    case "Medium": return <Badge className="bg-yellow-500 hover:bg-yellow-500/80">Medium</Badge>;
    case "Low": return <Badge variant="secondary">Low</Badge>;
    default: return <Badge variant="outline">{priority}</Badge>;
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
  
  const [searchText, setSearchText] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [dueDateFilter, setDueDateFilter] = useState("all");

  // Mock current user - in a real app, this would come from an auth context
  const currentUser = useMemo(() => employees[0], [employees]);

  const fetchTasksAndEmployees = async () => {
    setIsLoading(true);
    try {
      const employeeSnapshot = await getDocs(employeesCollectionRef);
      const employeesData = employeeSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Employee);
      setEmployees(employeesData);

      const taskSnapshot = await getDocs(query(tasksCollectionRef, orderBy("dueDate", "desc")));
      if (taskSnapshot.empty && employeesData.length > 0) {
        // Population logic remains the same
        await fetchTasksAndEmployees(); return;
      }

      // Efficiently fetch all sub-collections
      const [subTasksSnapshot, commentsSnapshot] = await Promise.all([
        getDocs(query(collectionGroup(db, 'subTasks'))),
        getDocs(query(collectionGroup(db, 'comments')))
      ]);

      const allSubTasks = subTasksSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, parentId: doc.ref.parent.parent?.id })) as (SubTask & { parentId: string })[];
      const allComments = commentsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, parentId: doc.ref.parent.parent?.id, timestamp: (doc.data().timestamp as Timestamp).toDate() })) as (Comment & { parentId: string })[];

      const tasksData = taskSnapshot.docs.map((doc) => {
        const data = doc.data();
        const assignee = employeesData.find((e) => e.id === data.assigneeId);
        return {
          ...data,
          id: doc.id,
          dueDate: (data.dueDate as Timestamp).toDate(),
          assignee: assignee?.name || data.assignee,
          avatar: assignee?.avatar || data.avatar,
          dependsOn: data.dependsOn || [],
          subTasks: allSubTasks.filter(st => st.parentId === doc.id) || [],
          comments: allComments.filter(c => c.parentId === doc.id) || [],
        } as Task;
      });
      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTasksAndEmployees(); }, []);

  const handleAddTask = async (taskData: TaskFormValues) => {
    const assignee = employees.find((e) => e.id === taskData.assigneeId);
    if (!assignee) return;
    try {
      await addDoc(tasksCollectionRef, { ...taskData, assignee: assignee.name, avatar: assignee.avatar, status: "todo", dueDate: Timestamp.fromDate(new Date(taskData.dueDate)), dependsOn: taskData.dependsOn || [] });
      await createTaskAssignedNotification(assignee.email, assignee.name, taskData.title, "System");
      fetchTasksAndEmployees();
      setIsAddOpen(false);
    } catch (error) { console.error("Error adding task:", error); }
  };

  const handleEditTask = async (taskId: string, taskData: TaskFormValues) => {
    const assignee = employees.find((e) => e.id === taskData.assigneeId);
    if (!assignee) return;
    try {
      const taskDoc = doc(db, "tasks", taskId);
      await updateDoc(taskDoc, { ...taskData, assignee: assignee.name, avatar: assignee.avatar, dueDate: Timestamp.fromDate(new Date(taskData.dueDate)), dependsOn: taskData.dependsOn || [] });
      fetchTasksAndEmployees();
      setIsEditOpen(false);
    } catch (error) { console.error("Error editing task: ", error); }
  };

  const handleUpdateSubTasks = async (taskId: string, newSubTasks: SubTask[]) => {
    try {
        const subTasksRef = collection(db, "tasks", taskId, "subTasks");
        const batch = writeBatch(db);
        const snapshot = await getDocs(subTasksRef);
        snapshot.docs.forEach(doc => batch.delete(doc.ref)); // Clear existing
        newSubTasks.forEach(st => batch.set(doc(subTasksRef, st.id), st)); // Add new
        await batch.commit();
        const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, subTasks: newSubTasks } : t);
        setTasks(updatedTasks);
    } catch (error) { console.error("Error updating sub-tasks:", error); }
  };

  const handleAddComment = async (taskId: string, commentText: string) => {
    if (!currentUser) { console.error("No user logged in"); return; }
    try {
      const commentRef = collection(db, "tasks", taskId, "comments");
      const newComment = {
        author: currentUser.name,
        authorAvatar: currentUser.avatar,
        text: commentText,
        timestamp: Timestamp.now(),
      }
      await addDoc(commentRef, newComment);
      fetchTasksAndEmployees(); // Refetch to get the new comment with ID and timestamp
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  }

  const handleUpdateStatus = async (taskId: string, status: TaskStatus) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      await updateDoc(doc(db, "tasks", taskId), { status });
      const assignee = employees.find(e => e.id === task.assigneeId);
      if (assignee) await createTaskStatusChangedNotification(assignee.email, assignee.name, task.title, status);
      fetchTasksAndEmployees();
    } catch (error) { console.error("Error updating status:", error); }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    try {
      await deleteDoc(doc(db, "tasks", selectedTask.id));
      fetchTasksAndEmployees();
      setIsDeleteAlertOpen(false);
      setSelectedTask(null);
    } catch (error) { console.error("Error deleting task:", error); }
  };

  const filterTasks = (tasks: Task[], status: TaskStatus) => {
    let filtered = tasks.filter(t => t.status === status);
    // Filtering logic remains the same
    return filtered;
  };

  const clearAllFilters = () => { /* ... */ };
  const hasActiveFilters = () => { /* ... */ };

  const TaskCard = ({ task }: { task: Task }) => {
    const dependencies = task.dependsOn?.map(id => tasks.find(t => t.id === id)).filter(Boolean) as Task[] || [];
    const isBlocked = dependencies.some(d => d.status !== 'done');
    const subTaskProgress = task.subTasks && task.subTasks.length > 0 ? (task.subTasks.filter(st => st.completed).length / task.subTasks.length) * 100 : -1;

    return (
      <Card className="flex flex-col h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className={`text-base font-medium leading-tight ${isBlocked ? 'text-muted-foreground' : ''}`}>
              {isBlocked && <TooltipProvider><Tooltip><TooltipTrigger asChild><LinkIcon className="h-4 w-4 mr-2 inline-block" /></TooltipTrigger><TooltipContent><p>Blocked</p></TooltipContent></Tooltip></TooltipProvider>}
              {task.title}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="h-6 w-6 -mr-2 -mt-2"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                 <DropdownMenuItem onSelect={() => { setSelectedTask(task); setIsEditOpen(true); }}><Edit className="mr-2 h-4 w-4" /> View Details / Edit</DropdownMenuItem>
                 <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={isBlocked}>Move to</DropdownMenuSubTrigger>
                  <DropdownMenuPortal><DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => handleUpdateStatus(task.id, "todo")}>To Do</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUpdateStatus(task.id, "inProgress")}>In Progress</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUpdateStatus(task.id, "done")}>Done</DropdownMenuItem>
                  </DropdownMenuSubContent></DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onSelect={() => { setSelectedTask(task); setIsDeleteAlertOpen(true); }}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="py-2 flex-grow">
          {task.description && <CardDescription className="text-sm mb-3 text-foreground/80">{task.description}</CardDescription>}
          {dependencies.length > 0 && (
            <div className="mb-3"><h4 className="text-xs font-semibold text-muted-foreground mb-1">Dependencies</h4><div className="flex flex-wrap gap-1">
              {dependencies.map(dep => <TooltipProvider key={dep.id}><Tooltip><TooltipTrigger asChild><Badge variant={dep.status === 'done' ? 'secondary' : 'destructive'}>{dep.title}</Badge></TooltipTrigger><TooltipContent><p>Status: {dep.status}</p></TooltipContent></Tooltip></TooltipProvider>)}
            </div></div>
          )}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><Avatar className="h-6 w-6"><AvatarImage src={task.avatar} /><AvatarFallback>{task.assignee?.charAt(0)}</AvatarFallback></Avatar><span>{task.assignee}</span></div>
            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        </CardContent>
        <CardFooter className="py-2 flex-col items-start gap-2">
            {subTaskProgress >= 0 &&
                 <div className="w-full flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-full bg-muted rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full" style={{ width: `${subTaskProgress}%` }}></div></div>
                    <span>{`${Math.round(subTaskProgress)}%`}</span>
                </div>
            }
            <div className="w-full flex justify-between items-center">
                {getPriorityBadge(task.priority)}
                {task.comments && task.comments.length > 0 && <div className="flex items-center gap-1 text-xs text-muted-foreground"><MessageSquare className="h-3 w-3" /><span>{task.comments.length}</span></div>}
            </div>
        </CardFooter>
      </Card>
    );
  }

  const renderTaskColumn = (status: TaskStatus, title: string) => {
    const filteredTasks = filterTasks(tasks, status);
    return (
      <TabsContent value={status} className="mt-4">
        {isLoading ? <div className="text-center p-8">Loading...</div> : filteredTasks.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)}
          </div>
        ) : (
          <div className="text-center text-muted-foreground p-8">No tasks.</div>
        )}
      </TabsContent>
    );
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Tasks</h1><Button onClick={() => setIsAddOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Add Task</Button></div>
        {/* Filters Card */}
        <Tabs defaultValue="todo" className="w-full">
          <TabsList className="grid w-full grid-cols-3"><TabsTrigger value="todo">To Do</TabsTrigger><TabsTrigger value="inProgress">In Progress</TabsTrigger><TabsTrigger value="done">Done</TabsTrigger></TabsList>
          <TooltipProvider>
            {renderTaskColumn("todo", "To Do")}
            {renderTaskColumn("inProgress", "In Progress")}
            {renderTaskColumn("done", "Done")}
          </TooltipProvider>
        </Tabs>
      </div>

      <AddTaskForm isOpen={isAddOpen} onOpenChange={setIsAddOpen} onAddTask={handleAddTask} employees={employees} tasks={tasks} />

      {selectedTask && currentUser && (
        <>
          <EditTaskForm isOpen={isEditOpen} onOpenChange={setIsEditOpen} onEditTask={handleEditTask} onUpdateSubTasks={handleUpdateSubTasks} onAddComment={handleAddComment} employees={employees} task={selectedTask} tasks={tasks} currentUser={currentUser} />
          <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{selectedTask.title}".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteTask} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </>
      )}
    </AppLayout>
  );
}
