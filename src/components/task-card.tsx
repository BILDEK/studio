
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import type { Task } from "@/app/tasks/page";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
}

export function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityColors = {
    Low: "bg-green-500",
    Medium: "bg-yellow-500",
    High: "bg-red-500",
  };

  return (
    <Card ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <CardTitle className="text-base font-semibold truncate">{task.title}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}><Edit className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-500"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      {task.description && 
        <CardContent className="px-4 pb-2">
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{task.description}</p>
        </CardContent>
      }
      <CardFooter className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={task.avatar} />
            <AvatarFallback>{task.assignee?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{task.assignee}</span>
        </div>
        <div className="flex items-center gap-2">
          {task.dueDate && <Badge variant="outline" className="text-xs">{task.dueDate.toLocaleDateString()}</Badge>}
          <div className={`w-3 h-3 rounded-full ${priorityColors[task.priority]}`} title={`Priority: ${task.priority}`}></div>
        </div>
      </CardFooter>
    </Card>
  );
}
