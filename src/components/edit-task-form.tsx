
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import type { Employee } from "@/app/employees/page"
import type { Task, SubTask } from "@/app/tasks/page"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { TaskComments, type Comment } from "@/components/task-comments"
import { SubTaskList } from "@/components/sub-task-list"

const editTaskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  description: z.string().optional(),
  assigneeId: z.string().min(1, "Please select an assignee."),
  dueDate: z.date({ required_error: "A due date is required." }),
  priority: z.enum(["Low", "Medium", "High"]),
  dependsOn: z.array(z.string()).optional(),
})

export type TaskFormValues = z.infer<typeof editTaskSchema>

interface EditTaskFormProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onEditTask: (taskId: string, taskData: TaskFormValues) => void
  onUpdateSubTasks: (taskId: string, subTasks: SubTask[]) => void
  onAddComment: (taskId: string, commentText: string) => void;
  employees: Employee[]
  task: Task
  tasks: Task[]
  currentUser: Employee; // Assuming current user is an employee
}

export function EditTaskForm({
  isOpen,
  onOpenChange,
  onEditTask,
  onUpdateSubTasks,
  onAddComment,
  employees,
  task,
  tasks,
  currentUser
}: EditTaskFormProps) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(editTaskSchema),
  })

  React.useEffect(() => {
    if (task) {
        form.reset({
            title: task.title,
            description: task.description || "",
            assigneeId: task.assigneeId,
            dueDate: new Date(task.dueDate),
            priority: task.priority,
            dependsOn: task.dependsOn || [],
        })
    }
  }, [task, form, isOpen])

  function onSubmit(data: TaskFormValues) {
    onEditTask(task.id, data)
    // The dialog is closed in the parent page component upon successful submission
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* Increased width to accommodate comments and sub-tasks */}
      <DialogContent className="max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Form Fields */}
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Task Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="assigneeId" render={({ field }) => (<FormItem><FormLabel>Assign To</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select an employee" /></SelectTrigger></FormControl><SelectContent>{employees.map((e) => (<SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="priority" render={({ field }) => (<FormItem><FormLabel>Priority</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="dueDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Due Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="dependsOn" render={({ field }) => (<FormItem><FormLabel>Depends On</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select tasks" /></SelectTrigger></FormControl><SelectContent>{tasks.filter(t => t.id !== task.id).map((t) => (<SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                 <DialogFooter className="pt-4">
                   <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
                   <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </Form>
          </div>

          {/* Right Column for Sub-Tasks and Comments */}
          <div className="space-y-4">
            <Separator />
             <SubTaskList 
                taskId={task.id} 
                initialSubTasks={task.subTasks} 
                onUpdate={(newSubTasks) => onUpdateSubTasks(task.id, newSubTasks)} 
            />
            <Separator />
            <TaskComments 
                taskId={task.id} 
                initialComments={task.comments} 
                onAddComment={(commentText) => onAddComment(task.id, commentText)}
                currentUser={currentUser}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
