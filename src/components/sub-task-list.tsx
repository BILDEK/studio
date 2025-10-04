
"use client"

import { useState } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2 } from 'lucide-react';

// Basic sub-task structure
interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

interface SubTaskListProps {
  taskId: string;
  // These would be fetched from Firestore in a real implementation
  initialSubTasks?: SubTask[]; 
  onUpdate: (subTasks: SubTask[]) => void;
}

export function SubTaskList({ taskId, initialSubTasks = [], onUpdate }: SubTaskListProps) {
  const [subTasks, setSubTasks] = useState<SubTask[]>(initialSubTasks);
  const [newSubTaskText, setNewSubTaskText] = useState("");

  const handleAddSubTask = () => {
    if (newSubTaskText.trim() === "") return;
    const newSubTask: SubTask = {
      id: `${taskId}-${Date.now()}`,
      text: newSubTaskText.trim(),
      completed: false,
    };
    const updatedSubTasks = [...subTasks, newSubTask];
    setSubTasks(updatedSubTasks);
    onUpdate(updatedSubTasks);
    setNewSubTaskText("");
  };

  const handleToggleComplete = (subTaskId: string) => {
    const updatedSubTasks = subTasks.map(st => 
      st.id === subTaskId ? { ...st, completed: !st.completed } : st
    );
    setSubTasks(updatedSubTasks);
    onUpdate(updatedSubTasks);
  }

  const handleDeleteSubTask = (subTaskId: string) => {
    const updatedSubTasks = subTasks.filter(st => st.id !== subTaskId);
    setSubTasks(updatedSubTasks);
    onUpdate(updatedSubTasks);
  }

  const completedCount = subTasks.filter(st => st.completed).length;
  const totalCount = subTasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-2 pt-2">
        <h4 className="text-xs font-semibold text-muted-foreground">Sub-Tasks</h4>
        {totalCount > 0 && (
            <div className="flex items-center gap-2">
                 <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
                <span className='text-xs text-muted-foreground'>{`${completedCount}/${totalCount}`}</span>
            </div>
        )}

        <div className="max-h-32 overflow-y-auto pr-2 space-y-1">
            {subTasks.map(subTask => (
            <div key={subTask.id} className="flex items-center gap-2 group">
                <Checkbox 
                    id={`subtask-${subTask.id}`}
                    checked={subTask.completed} 
                    onCheckedChange={() => handleToggleComplete(subTask.id)}
                />
                <label htmlFor={`subtask-${subTask.id}`} className={`flex-grow text-sm ${subTask.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {subTask.text}
                </label>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteSubTask(subTask.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </div>
            ))}
        </div>

      <div className="flex items-center gap-2 pt-1">
        <Input 
          placeholder="Add a sub-task..."
          value={newSubTaskText}
          onChange={(e) => setNewSubTaskText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddSubTask()}
          className="h-8 text-sm"
        />
        <Button size="sm" onClick={handleAddSubTask}> 
          <Plus className="h-4 w-4 mr-1"/> Add
        </Button>
      </div>
    </div>
  );
}
