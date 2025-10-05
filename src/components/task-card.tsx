'use client'

import type { Task } from "@/app/tasks/page";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, CalendarIcon } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSub, 
  DropdownMenuSubTrigger, 
  DropdownMenuSubContent, 
  DropdownMenuPortal, 
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
}

const priorityStyles: { [key in Task['priority']]: string } = {
  Low: "bg-green-500",
  Medium: "bg-yellow-500",
  High: "bg-red-500",
};

export function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const { title, description, priority, dueDate, assignee, avatar } = task;
  const statusOptions: Task['status'][] = ["To Do", "In Progress", "Done", "Blocked"];

  return (
    <Card className="mb-4 bg-gray-800 border-gray-700 text-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold">{title}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-full hover:bg-gray-700">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-white">
            <DropdownMenuItem onClick={() => onEdit(task)} className="hover:bg-gray-700 cursor-pointer">Edit</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="hover:bg-gray-700 cursor-pointer">Change Status</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="bg-gray-800 border-gray-700 text-white">
                  {statusOptions.map(option => (
                    <DropdownMenuItem key={option} onClick={() => onStatusChange(task.id, option)} className="hover:bg-gray-700 cursor-pointer">
                      {option}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-red-500 hover:bg-red-500 hover:text-white cursor-pointer">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {description && <p className="text-gray-400 mb-4">{description}</p>}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Badge className={cn("w-3 h-3 p-0 rounded-full", priorityStyles[priority])} />
            <span className="text-sm font-medium">{priority} Priority</span>
          </div>
          <div className="flex items-center space-x-2">
             <Avatar className="h-6 w-6">
               <AvatarImage src={avatar} alt={assignee || 'Unassigned'} />
               <AvatarFallback>{assignee ? assignee.charAt(0) : 'U'}</AvatarFallback>
             </Avatar>
            <span className="text-sm">{assignee || 'Unassigned'}</span>
          </div>
        </div>
        <div className="flex items-center mt-4 text-sm text-gray-400">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dueDate ? (
            <span>{format(new Date(dueDate), "MMM d, yyyy")}</span>
          ) : (
            <span>No due date</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
