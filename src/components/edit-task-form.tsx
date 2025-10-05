
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect, useMemo } from "react"
import { useForm, Controller, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import type { Task, SubTask, Comment, Employee } from "@/app/tasks/page"
import { CalendarIcon, PlusCircle, Trash2, Paperclip, Send, GripVertical, Link as LinkIcon, ExternalLink, X, Check } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ScrollArea } from "@/components/ui/scroll-area"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

const storage = getStorage();

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["To Do", "In Progress", "Done", "Blocked"]).default("To Do"),
  priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
  dueDate: z.date(),
  assigneeId: z.string().min(1, "Assignee is required"),
  dependsOn: z.array(z.string()).optional(),
});

export type TaskFormValues = z.infer<typeof taskSchema>;

interface SortableSubTaskItemProps {
  item: SubTask;
  index: number;
  onUpdate: (index: number, text: string) => void;
  onToggle: (index: number) => void;
  onRemove: (index: number) => void;
}

function SortableSubTaskItem({ item, index, onUpdate, onToggle, onRemove }: SortableSubTaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="flex items-center gap-2 bg-background p-2 rounded">
      <span {...listeners} className="cursor-move">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </span>
      <input
        type="checkbox"
        checked={item.completed}
        onChange={() => onToggle(index)}
        className="h-5 w-5 accent-primary cursor-pointer"
      />
      <Input
        value={item.text}
        onChange={(e) => onUpdate(index, e.target.value)}
        className={cn("flex-grow border-none focus-visible:ring-0", item.completed && "line-through text-muted-foreground")}
      />
      <Button variant="ghost" size="icon" onClick={() => onRemove(index)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

interface TaskCommentsProps {
  task: Task;
  currentUser: Employee;
  onAddComment: (taskId: string, commentText: string, attachments: { name: string, url: string }[]) => void;
}

function TaskComments({ task, currentUser, onAddComment }: TaskCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setAttachments(prev => [...prev, ...Array.from(event.target.files as FileList)]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddComment = async () => {
    if (newComment.trim() === "" && attachments.length === 0) return;
    setIsUploading(true);

    const attachmentUrls: { name: string, url: string }[] = [];

    try {
        for (const file of attachments) {
            const storageRef = ref(storage, `task-attachments/${task.id}/${Date.now()}-${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            attachmentUrls.push({ name: file.name, url: downloadURL });
        }
        
        onAddComment(task.id, newComment, attachmentUrls);
        setNewComment("");
        setAttachments([]);
    } catch (error) {
        console.error("Error uploading attachments:", error);
        // Handle error display to user
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <h3 className="font-semibold">Comments</h3>
      <div className="flex gap-4">
        <Avatar>
          <AvatarImage src={currentUser.avatar} />
          <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-grow space-y-2">
          <Textarea 
            placeholder="Add a comment..." 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <div className="space-y-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center justify-between text-sm bg-muted p-1.5 rounded">
                  <span>{file.name}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveAttachment(index)}><X className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center">
            <Button variant="outline" size="sm" asChild>
                <label htmlFor="comment-attachment" className="cursor-pointer flex items-center">
                    <Paperclip className="mr-2 h-4 w-4" /> Attach File
                    <input id="comment-attachment" type="file" className="hidden" multiple onChange={handleFileChange}/>
                </label>
            </Button>
            <Button onClick={handleAddComment} disabled={isUploading || (newComment.trim() === "" && attachments.length === 0)}>
              {isUploading ? 'Sending...' : <><Send className="mr-2 h-4 w-4" /> Send</>}
            </Button>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {task.comments.map(comment => (
          <div key={comment.id} className="flex gap-4 text-sm">
            <Avatar>
              <AvatarImage src={comment.authorAvatar} />
              <AvatarFallback>{comment.authorName?.charAt(0) ?? 'A'}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
                <div className="flex items-center gap-2">
                    <span className="font-semibold">{comment.authorName}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(comment.timestamp), "MMM d, yyyy h:mm a")}</span>
                </div>
                <p className="whitespace-pre-wrap">{comment.text}</p>
                {comment.attachments && comment.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                        {comment.attachments.map((att, index) => (
                            <a href={att.url} target="_blank" rel="noopener noreferrer" key={index} className="flex items-center gap-2 text-primary hover:underline bg-primary/10 p-2 rounded-lg">
                                <Paperclip className="h-4 w-4" />
                                <span>{att.name}</span>
                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </a>
                        ))}
                    </div>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface EditTaskFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onEditTask: (id: string, data: TaskFormValues) => void;
  onUpdateSubTasks: (taskId: string, subTasks: SubTask[]) => void;
  onAddComment: (taskId: string, commentText: string, attachments: { name: string, url: string }[]) => void;
  task: Task;
  employees: Employee[];
  tasks: Task[]; // For dependency selection
  currentUser: Employee;
}

export function EditTaskForm({ isOpen, onOpenChange, onEditTask, onUpdateSubTasks, onAddComment, task, employees, tasks, currentUser }: EditTaskFormProps) {
  const [subTasks, setSubTasks] = useState<SubTask[]>([...task.subTasks]);
  const { register, handleSubmit, control, formState: { errors }, reset, watch } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      ...task,
      dueDate: task.dueDate ? new Date(task.dueDate) : new Date(),
      dependsOn: task.dependsOn || []
    }
  });

  useEffect(() => {
    reset({ ...task, dueDate: task.dueDate ? new Date(task.dueDate) : new Date(), dependsOn: task.dependsOn || [] });
    setSubTasks([...task.subTasks]);
  }, [task, reset]);

  const onSubmit = (data: TaskFormValues) => {
    onEditTask(task.id, data);
    onUpdateSubTasks(task.id, subTasks);
    onOpenChange(false);
  };

  // Sub-task logic
  const handleAddSubTask = () => {
    setSubTasks([...subTasks, { id: `temp-${Date.now()}`, parentId: task.id, text: "", completed: false }]);
  };

  const handleUpdateSubTask = (index: number, text: string) => {
    const newSubTasks = [...subTasks];
    newSubTasks[index].text = text;
    setSubTasks(newSubTasks);
  };

  const handleToggleSubTask = (index: number) => {
    const newSubTasks = [...subTasks];
    newSubTasks[index].completed = !newSubTasks[index].completed;
    setSubTasks(newSubTasks);
  }

  const handleRemoveSubTask = (index: number) => {
    setSubTasks(subTasks.filter((_, i) => i !== index));
  };

  const handleSubTaskDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = subTasks.findIndex(item => item.id === active.id);
      const newIndex = subTasks.findIndex(item => item.id === over.id);
      setSubTasks(arrayMove(subTasks, oldIndex, newIndex));
    }
  };

  const availableDependencies = useMemo(() => {
    return tasks.filter(t => t.id !== task.id && !t.dependsOn?.includes(task.id));
  }, [tasks, task.id]);
  
  const {fields: dependsOnFields, append: appendDependency, remove: removeDependency} = useFieldArray({ control, name: "dependsOn" });
  const watchedDependencies = watch("dependsOn") || [];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl"
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('[data-cmdk-root]')) {
            e.preventDefault();
          }
        }}
      >
        <ScrollArea className="max-h-[85vh]">
        <div className="pr-6 py-4">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Update the details of your task.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 divide-y divide-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
             {/* Left Column */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <label htmlFor="title" className="font-semibold">Title</label>
                <Input id="title" {...register("title")} className="mt-1" />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <label htmlFor="description" className="font-semibold">Description</label>
                <Textarea id="description" {...register("description")} className="mt-1" />
              </div>

               {/* Sub-tasks section */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Sub-tasks</h3>
                  <Button type="button" variant="ghost" size="sm" onClick={handleAddSubTask}>
                      <PlusCircle className="mr-2 h-4 w-4"/> Add Sub-task
                  </Button>
                </div>
                <DndContext sensors={[]} onDragEnd={handleSubTaskDragEnd} collisionDetection={closestCenter}>
                  <SortableContext items={subTasks} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {subTasks.map((item, index) => (
                        <SortableSubTaskItem 
                          key={item.id}
                          item={item}
                          index={index}
                          onUpdate={handleUpdateSubTask}
                          onToggle={handleToggleSubTask}
                          onRemove={handleRemoveSubTask}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4 bg-muted/50 p-4 rounded-lg">
              <div>
                <label className="font-semibold text-sm">Status</label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="To Do">To Do</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                        <SelectItem value="Blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
               <div>
                <label className="font-semibold text-sm">Priority</label>
                 <Controller
                  control={control}
                  name="priority"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <label className="font-semibold text-sm">Assignee</label>
                 <Controller
                  control={control}
                  name="assigneeId"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {employees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                 {errors.assigneeId && <p className="text-red-500 text-sm mt-1">{errors.assigneeId.message}</p>}
              </div>
              <div>
                <label className="font-semibold text-sm">Due Date</label>
                 <Controller
                  control={control}
                  name="dueDate"
                  render={({ field }) => (
                     <Popover>
                      <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </div>
               <div>
                <label htmlFor="dependencies" className="font-semibold text-sm">Dependencies</label>
                <Controller
                  control={control}
                  name="dependsOn"
                  render={({ field }) => (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal mt-1">
                                <LinkIcon className="mr-2 h-4 w-4"/>
                                {watchedDependencies.length > 0 ? `${watchedDependencies.length} tasks selected` : 'Select tasks'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                           <Command>
                              <CommandInput placeholder="Search tasks..." />
                              <CommandList>
                                <CommandEmpty>No tasks found.</CommandEmpty>
                                <CommandGroup>
                                  {availableDependencies.map(depTask => (
                                    <CommandItem
                                      key={depTask.id}
                                      value={depTask.id}
                                      onSelect={() => {
                                        const isSelected = watchedDependencies.includes(depTask.id);
                                        if (isSelected) {
                                          removeDependency(watchedDependencies.indexOf(depTask.id));
                                        } else {
                                          appendDependency(depTask.id);
                                        }
                                      }}
                                    >
                                       <Check className={cn("mr-2 h-4 w-4", watchedDependencies.includes(depTask.id) ? "opacity-100" : "opacity-0")} />
                                      {depTask.title}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Comments section */}
          <div className="pt-4">
             <TaskComments task={task} currentUser={currentUser} onAddComment={onAddComment} />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
        </div>
       </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
