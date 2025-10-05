
"use client"

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, Paperclip, X, Download, File as FileIcon } from 'lucide-react';
import { storage } from "@/lib/firebase"; // Import storage
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

// Expanded sub-task structure to include attachments
interface Attachment {
  name: string;
  url: string;
  path: string; // Store the storage path for deletion
  size: number; // Store file size
}

interface SubTask {
  id: string;
  text: string;
  completed: boolean;
  attachments?: Attachment[];
}

interface SubTaskListProps {
  taskId: string;
  initialSubTasks?: SubTask[]; 
  onUpdate: (subTasks: SubTask[]) => void;
}

// Helper to format bytes
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export function SubTaskList({ taskId, initialSubTasks = [], onUpdate }: SubTaskListProps) {
  const [subTasks, setSubTasks] = useState<SubTask[]>(initialSubTasks);
  const [newSubTaskText, setNewSubTaskText] = useState("");
  const [uploading, setUploading] = useState<string | null>(null); // Track which sub-task is uploading
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSubTaskId, setSelectedSubTaskId] = useState<string | null>(null);

  const handleAttachClick = (subTaskId: string) => {
    setSelectedSubTaskId(subTaskId);
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !selectedSubTaskId) {
      return;
    }
    const file = event.target.files[0];
    const subTaskId = selectedSubTaskId;

    setUploading(subTaskId);

    try {
      const filePath = `tasks/${taskId}/${subTaskId}/${file.name}`;
      const storageRef = ref(storage, filePath);
      
      const uploadResult = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(uploadResult.ref);

      const newAttachment: Attachment = { name: file.name, url, path: filePath, size: file.size };

      const updatedSubTasks = subTasks.map(st => {
        if (st.id === subTaskId) {
          const existingAttachments = st.attachments || [];
          return { ...st, attachments: [...existingAttachments, newAttachment] };
        }
        return st;
      });

      setSubTasks(updatedSubTasks);
      onUpdate(updatedSubTasks);

    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(null);
      setSelectedSubTaskId(null);
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  
  const handleAddSubTask = () => {
    if (newSubTaskText.trim() === "") return;
    const newSubTask: SubTask = {
      id: `${taskId}-${Date.now()}`,
      text: newSubTaskText.trim(),
      completed: false,
      attachments: [],
    };
    const updatedSubTasks = [...subTasks, newSubTask];
    setSubTasks(updatedSubTasks);
    onUpdate(updatedSubTasks);
    setNewSubTaskText("");
  };

  const handleDeleteAttachment = async (subTaskId: string, attachmentPath: string) => {
    try {
        const fileRef = ref(storage, attachmentPath);
        await deleteObject(fileRef);

        const updatedSubTasks = subTasks.map(st => {
            if (st.id === subTaskId) {
                return { ...st, attachments: st.attachments?.filter(att => att.path !== attachmentPath) };
            }
            return st;
        });

        setSubTasks(updatedSubTasks);
        onUpdate(updatedSubTasks);

    } catch (error) {
        console.error("Error deleting attachment:", error);
    }
  }

  const handleToggleComplete = (subTaskId: string) => {
    const updatedSubTasks = subTasks.map(st => 
      st.id === subTaskId ? { ...st, completed: !st.completed } : st
    );
    setSubTasks(updatedSubTasks);
    onUpdate(updatedSubTasks);
  }

  const handleDeleteSubTask = (subTaskId: string) => {
    const subTaskToDelete = subTasks.find(st => st.id === subTaskId);
    subTaskToDelete?.attachments?.forEach(att => {
        const fileRef = ref(storage, att.path);
        deleteObject(fileRef).catch(error => console.error("Error cleaning up attachment:", error));
    });

    const updatedSubTasks = subTasks.filter(st => st.id !== subTaskId);
    setSubTasks(updatedSubTasks);
    onUpdate(updatedSubTasks);
  }

  const completedCount = subTasks.filter(st => st.completed).length;
  const totalCount = subTasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <TooltipProvider>
    <div className="space-y-2 pt-2">
        <h4 className="text-xs font-semibold text-muted-foreground">Sub-Tasks</h4>
        {totalCount > 0 && (
             <div className="flex items-center gap-2">
                 <div className="w-full bg-muted rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full" style={{ width: `${progress}%` }}></div></div>
                 <span className='text-xs text-muted-foreground'>{`${completedCount}/${totalCount}`}</span>
             </div>
        )}

        <div className="max-h-48 overflow-y-auto pr-2 space-y-2">
            {subTasks.map(subTask => (
            <div key={subTask.id} className="rounded-md border border-transparent hover:border-muted p-1">
                <div className="flex items-center gap-2 group">
                    <Checkbox id={`subtask-${subTask.id}`} checked={subTask.completed} onCheckedChange={() => handleToggleComplete(subTask.id)}/>
                    <label htmlFor={`subtask-${subTask.id}`} className={`flex-grow text-sm ${subTask.completed ? 'line-through text-muted-foreground' : ''}`}>{subTask.text}</label>
                     <Tooltip><TooltipTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleAttachClick(subTask.id)} disabled={uploading === subTask.id}>
                            {uploading === subTask.id ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" /> : <Paperclip className="h-4 w-4" />}
                        </Button>
                     </TooltipTrigger><TooltipContent><p>Attach File</p></TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteSubTask(subTask.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </TooltipTrigger><TooltipContent><p>Delete Sub-task</p></TooltipContent></Tooltip>
                </div>
                {subTask.attachments && subTask.attachments.length > 0 && (
                    <div className="pl-6 pt-2 space-y-1">
                        {subTask.attachments.map(att => (
                             <div key={att.path} className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 p-1.5 rounded-md">
                                <div className="flex items-center gap-2 truncate">
                                    <FileIcon className="h-4 w-4 flex-shrink-0" />
                                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline flex-grow pr-2" title={att.name}>{att.name}</a>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-xs text-foreground/70">{formatBytes(att.size)}</span>
                                    <Tooltip><TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleDeleteAttachment(subTask.id, att.path)}><X className="h-3 w-3" /></Button>
                                    </TooltipTrigger><TooltipContent><p>Delete Attachment</p></TooltipContent></Tooltip>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            ))}
        </div>

      <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />

      <div className="flex items-center gap-2 pt-1">
        <Input placeholder="Add a sub-task..." value={newSubTaskText} onChange={(e) => setNewSubTaskText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSubTask()} className="h-8 text-sm" />
        <Button size="sm" onClick={handleAddSubTask}><Plus className="h-4 w-4 mr-1"/> Add</Button>
      </div>
    </div>
    </TooltipProvider>
  );
}
