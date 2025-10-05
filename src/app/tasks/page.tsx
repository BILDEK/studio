
"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, writeBatch, query, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger, 
  DropdownMenuSub, 
  DropdownMenuSubTrigger, 
  DropdownMenuSubContent, 
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu"
import { PlusCircle, MoreHorizontal, Edit, Trash2, Search, Filter, X } from "lucide-react"
import { AddTaskForm, TaskFormValues } from "@/components/add-task-form"
import { EditTaskForm } from "@/components/edit-task-form"
import type { Employee } from "@/app/employees/page"
import { Input } from "@/components/ui/input"
import {
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from "@/components/task-card"
import { Badge } from "@/components/ui/badge";

// --- TYPE DEFINITIONS ---
export interface SubTask {
  id: string;
  parentId: string;
  text: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  parentId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  timestamp: Date;
  attachments?: Attachment[];
}

export interface Attachment {
  name: string;
  url: string;
}

export interface Task {
  id: string
  title: string
  description?: string
  status: "To Do" | "In Progress" | "Done" | "Blocked"
  priority: "Low" | "Medium" | "High"
  dueDate: Date | null
  assigneeId: string
  assignee?: string
  avatar?: string
  subTasks: SubTask[];
  comments: Comment[];
  dependsOn: string[];
}

const tasksCollectionRef = collection(db, "tasks");
const employeesCollectionRef = collection(db, "employees");

// --- MAIN PAGE COMPONENT ---
export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<{status: string[], priority: string[], assignee: string[]}>({ status: [], priority: [], assignee: [] });
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [activeStatus, setActiveStatus] = useState<Task['status'] | 'All'>('All');

  // --- DATA FETCHING LOGIC ---
  const fetchTasksAndEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const [taskSnapshot, employeeSnapshot] = await Promise.all([
        getDocs(tasksCollectionRef),
        getDocs(employeesCollectionRef),
      ]);

      const employeeData = employeeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Employee[];
      setEmployees(employeeData);
      setCurrentUser(employeeData.find(e => e.id === "emp-1") || employeeData[0]);

      const taskDataPromises = taskSnapshot.docs.map(async (taskDoc) => {
        const data = taskDoc.data();
        const assignee = employeeData.find(e => e.id === data.assigneeId);

        const subTasksCollectionRef = collection(db, "tasks", taskDoc.id, "subTasks");
        const commentsCollectionRef = collection(db, "tasks", taskDoc.id, "comments");

        const [subTasksSnapshot, commentsSnapshot] = await Promise.all([
            getDocs(subTasksCollectionRef),
            getDocs(commentsCollectionRef)
        ]);

        const subTasks = subTasksSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as SubTask[];

        const comments = commentsSnapshot.docs.map(doc => {
            const commentData = doc.data();
            const timestamp = commentData.timestamp instanceof Timestamp
                ? commentData.timestamp.toDate()
                : new Date(); 
            return { ...commentData, id: doc.id, timestamp } as Comment;
        });

        const dueDate = data.dueDate instanceof Timestamp ? data.dueDate.toDate() : null;

        let normalizedStatus: Task['status'] = 'To Do';
        switch(data.status) {
            case 'todo': case 'To Do': normalizedStatus = 'To Do'; break;
            case 'inProgress': case 'In Progress': normalizedStatus = 'In Progress'; break;
            case 'done': case 'Done': normalizedStatus = 'Done'; break;
            case 'blocked': case 'Blocked': normalizedStatus = 'Blocked'; break;
        }

        return {
            ...data,
            id: taskDoc.id,
            dueDate: dueDate,
            status: normalizedStatus,
            assignee: assignee?.name || "Unassigned",
            avatar: assignee?.avatar,
            subTasks: subTasks,
            comments: comments.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
            dependsOn: data.dependsOn || [],
        } as Task;
      });

      const taskData = await Promise.all(taskDataPromises);
      setTasks(taskData);

    } catch (error) {
      console.error("Error fetching data: ", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasksAndEmployees();
  }, [fetchTasksAndEmployees]);

  // --- FILTERING LOGIC ---
  const filteredTasks = useMemo(() => {
    let filtered = tasks
      .filter(task => task.title.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(task => filters.priority.length === 0 || filters.priority.includes(task.priority))
      .filter(task => filters.assignee.length === 0 || filters.assignee.includes(task.assigneeId));
    
    const combinedStatusFilters = [...filters.status];
    if (activeStatus !== 'All' && !combinedStatusFilters.includes(activeStatus)) {
        combinedStatusFilters.push(activeStatus);
    }

    if (combinedStatusFilters.length > 0) {
        if (activeStatus !== 'All' && filters.status.length === 0) {
             filtered = filtered.filter(task => task.status === activeStatus);
        } else {
             filtered = filtered.filter(task => combinedStatusFilters.includes(task.status));
        }
    }
    
    return filtered;
  }, [tasks, searchTerm, filters, activeStatus]);


  // --- CRUD HANDLERS ---
  const handleAddOrEditTask = async (taskData: TaskFormValues, taskId?: string) => {
    const isEditing = !!taskId;
    try {
      const docData = {
        ...taskData,
        dueDate: Timestamp.fromDate(taskData.dueDate),
      };

      if (isEditing) {
        await updateDoc(doc(db, "tasks", taskId), docData);
      } else {
        await addDoc(tasksCollectionRef, { ...docData, status: "To Do" });
      }
      
      await fetchTasksAndEmployees(); // <-- RE-FETCH DATA
      setIsAddOpen(false);
      setIsEditOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error(`Error ${isEditing ? 'editing' : 'adding'} task:`, error);
    }
  };
  
  const handleUpdateSubTasks = async (taskId: string, subTasksToUpdate: SubTask[]) => {
    try {
      const batch = writeBatch(db);
      const subTasksCollectionRef = collection(db, "tasks", taskId, "subTasks");
      const existingSubTasksSnapshot = await getDocs(subTasksCollectionRef);
      const existingSubTaskIds = new Set(existingSubTasksSnapshot.docs.map(d => d.id));

      for (const subTask of subTasksToUpdate) {
        const subTaskRef = subTask.id.startsWith('temp-') 
          ? doc(subTasksCollectionRef) 
          : doc(subTasksCollectionRef, subTask.id);
        batch.set(subTaskRef, { ...subTask, parentId: taskId, id: subTaskRef.id });
        existingSubTaskIds.delete(subTask.id);
      }

      existingSubTaskIds.forEach(idToDelete => {
        batch.delete(doc(subTasksCollectionRef, idToDelete));
      });

      await batch.commit();
      await fetchTasksAndEmployees(); // <-- RE-FETCH DATA
    } catch (error) {
      console.error("Error updating sub-tasks: ", error);
    }
  };

  const handleAddComment = async (taskId: string, commentText: string, attachments: { name: string, url: string }[]) => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, "tasks", taskId, "comments"), {
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar,
        text: commentText,
        timestamp: Timestamp.now(),
        attachments: attachments,
      });
      await fetchTasksAndEmployees(); // <-- RE-FETCH DATA
    } catch (error) {
      console.error("Error adding comment: ", error);
    }
  };
  
  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    try {
      await deleteDoc(doc(db, "tasks", selectedTask.id));
      await fetchTasksAndEmployees(); // <-- RE-FETCH DATA
      setIsDeleteAlertOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error("Error deleting task: ", error);
    }
  };

  const handleStatusChange = async (taskId: string, status: Task['status']) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), { status });
      await fetchTasksAndEmployees(); // <-- RE-FETCH DATA
    } catch (error) {
      console.error("Error updating status: ", error);
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    // Reordering logic can be implemented here if needed
  };

  const toggleFilter = (category: 'status' | 'priority' | 'assignee', value: string) => {
    setFilters(prev => {
        const newFilter = { ...prev };
        const current = newFilter[category] as string[];
        if(current.includes(value)) {
            newFilter[category] = current.filter(item => item !== value);
        } else {
            newFilter[category] = [...current, value];
        }
        return newFilter;
    });
  };
  
  const statusTabs: (Task['status'] | 'All')[] = ['All', 'To Do', 'In Progress', 'Done', 'Blocked'];

  // --- RENDER LOGIC ---
  return (
    <AppLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <Button onClick={() => setIsAddOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Add Task</Button>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search tasks..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8" />
          </div>
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filter
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter By</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                          {["To Do", "In Progress", "Done", "Blocked"].map(status => (
                              <DropdownMenuCheckboxItem key={status} checked={filters.status.includes(status)} onSelect={(e) => e.preventDefault()} onClick={() => toggleFilter('status', status)}>{status}</DropdownMenuCheckboxItem>
                          ))}
                      </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Priority</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                          {["Low", "Medium", "High"].map(p => (
                             <DropdownMenuCheckboxItem key={p} checked={filters.priority.includes(p)} onSelect={(e) => e.preventDefault()} onClick={() => toggleFilter('priority', p)}>{p}</DropdownMenuCheckboxItem>
                          ))}
                      </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Assignee</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                          {employees.map(e => (
                             <DropdownMenuCheckboxItem key={e.id} checked={filters.assignee.includes(e.id)} onSelect={(e) => e.preventDefault()} onClick={() => toggleFilter('assignee', e.id)}>{e.name}</DropdownMenuCheckboxItem>
                          ))}
                      </DropdownMenuSubContent>
                  </DropdownMenuSub>
                   {(filters.status.length > 0 || filters.priority.length > 0 || filters.assignee.length > 0) &&
                      <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setFilters({ status: [], priority: [], assignee: [] })} className="text-destructive">Clear Filters</DropdownMenuItem>
                      </>
                  }
              </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {filters.status.map(f => <Badge key={f} variant="outline" className="pr-1">Status: {f} <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => toggleFilter("status", f)}/></Badge>)}
          {filters.priority.map(f => <Badge key={f} variant="outline" className="pr-1">Priority: {f} <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => toggleFilter("priority", f)}/></Badge>)}
          {filters.assignee.map(f => <Badge key={f} variant="outline" className="pr-1">Assignee: {employees.find(e=>e.id === f)?.name} <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => toggleFilter("assignee", f)}/></Badge>)}
        </div>

        <div className="border-b border-border">
          <div className="flex items-center gap-2">
            {statusTabs.map(status => (
              <Button 
                key={status} 
                variant={activeStatus === status ? 'secondary' : 'ghost'} 
                onClick={() => setActiveStatus(status)}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
                data-state={activeStatus === status ? 'active' : 'inactive'}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">Loading tasks...</div>
        ) : (
          <div className="mt-4">
            <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
              <SortableContext items={filteredTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-4">
                      {filteredTasks.length > 0 ? filteredTasks.map(task => (
                          <TaskCard 
                              key={task.id} 
                              task={task} 
                              onEdit={() => { setSelectedTask(task); setIsEditOpen(true); }}
                              onDelete={() => { setSelectedTask(task); setIsDeleteAlertOpen(true); }}
                              onStatusChange={handleStatusChange}
                          />
                      )) : (
                          <div className="text-center text-muted-foreground py-10">No tasks found for this filter.</div>
                      )}
                 </div>
             </SortableContext>
            </DndContext>
          </div>
        )}
      </div>

      <AddTaskForm isOpen={isAddOpen} onOpenChange={setIsAddOpen} onAddTask={(data) => handleAddOrEditTask(data)} employees={employees} tasks={tasks} />

      {selectedTask && currentUser && (
        <>
          <EditTaskForm 
            isOpen={isEditOpen} 
            onOpenChange={(isOpen) => { if (!isOpen) setSelectedTask(null); setIsEditOpen(isOpen); }} 
            onEditTask={(id, data) => handleAddOrEditTask(data, id)}
            onUpdateSubTasks={handleUpdateSubTasks}
            onAddComment={handleAddComment}
            employees={employees}
            task={selectedTask}
            tasks={tasks}
            currentUser={currentUser}
          />
          <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete the task "{selectedTask.title}".</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedTask(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </AppLayout>
  )
}
