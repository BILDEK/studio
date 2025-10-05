
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Trash, Move } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Task } from "@/app/tasks/page";

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
}

const priorityStyles: Record<Task['priority'], string> = {
  "Low": "bg-blue-500",
  "Medium": "bg-yellow-500",
  "High": "bg-red-500",
};

export function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const { title, description, status, priority, dueDate, assignee, avatar } = task;
  const statusOptions: Task['status'][] = ["To Do", "In Progress", "Done", "Blocked"];

  return (
    <Card className="bg-gray-800 border-gray-700 text-white shadow-md hover:shadow-lg transition-shadow duration-200 relative overflow-hidden">
      <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", priorityStyles[priority])}></div>
      <CardHeader className="flex flex-row items-start justify-between pb-2 pl-6 pr-2 pt-4">
        <CardTitle className="text-lg font-semibold truncate" title={title}>
          {title}
        </CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
            <DropdownMenuSub>
                <DropdownMenuSubTrigger><Move className="mr-2 h-4 w-4" /> Move to</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                    {statusOptions.filter(s => s !== status).map(s => (
                        <DropdownMenuItem key={s} onClick={() => onStatusChange(task.id, s)}>{s}</DropdownMenuItem>
                    ))}
                </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-red-500"><Trash className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="pb-4 pl-6">
        <p className="text-sm text-gray-400 truncate">
          {description || "No description provided."}
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4 pl-6 pb-4">
        <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
                <AvatarImage src={avatar} alt={assignee} />
                <AvatarFallback>{assignee?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-gray-300">{assignee}</span>
        </div>
        {dueDate && (
          <Badge variant="outline" className="py-1 px-2 border-gray-600 text-gray-300">
            {format(new Date(dueDate), "dd.MM.yyyy")}
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}
