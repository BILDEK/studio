'use client'

import type { Task } from "@/app/tasks/page";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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
  const { title, description, status, priority, dueDate, assignee, avatar } = task;
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
            <DropdownMenuItem onClick={() => onEdit(task)} className="hover:bg-gray-700">Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-red-500 hover:bg-red-500 hover:text-white">Delete</DropdownMenuItem>
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
               <AvatarImage src={avatar} alt={assignee} />
               <AvatarFallback>{assignee.charAt(0)}</AvatarFallback>
             </Avatar>
            <span className="text-sm">{assignee}</span>
          </div>
        </div>
        <div className="mt-4">
          <Select value={status} onValueChange={(newStatus: Task['status']) => onStatusChange(task.id, newStatus)}>
            <SelectTrigger className="w-full bg-gray-700 border-gray-600 focus:ring-blue-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              {statusOptions.map(option => (
                <SelectItem key={option} value={option} className="hover:bg-gray-700">{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
