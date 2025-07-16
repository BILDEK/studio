"use client"

import * as React from "react"
import type { Employee } from "@/app/employees/page"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "./ui/separator"

interface EmployeeDetailsDialogProps {
  employee: Employee
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function EmployeeDetailsDialog({
  employee,
  isOpen,
  onOpenChange,
}: EmployeeDetailsDialogProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 border-green-200"
          >
            {status}
          </Badge>
        );
      case "Inactive":
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">{status}</Badge>;
      case "On Leave":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            {status}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Employee Details</DialogTitle>
          <DialogDescription>
            Full details for {employee.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 pt-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={employee.avatar} alt={employee.name} data-ai-hint="profile picture" />
            <AvatarFallback>
              {employee.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h2 className="text-xl font-semibold">{employee.name}</h2>
            <p className="text-muted-foreground">{employee.role}</p>
          </div>
        </div>
        <Separator className="my-2" />
        <div className="grid gap-2 text-sm">
          <div className="grid grid-cols-3 items-center gap-2">
            <span className="font-medium text-muted-foreground">Email</span>
            <span className="col-span-2">{employee.email}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-2">
            <span className="font-medium text-muted-foreground">Status</span>
            <div className="col-span-2">{getStatusBadge(employee.status)}</div>
          </div>
          <div className="grid grid-cols-3 items-center gap-2">
            <span className="font-medium text-muted-foreground">
              Last Activity
            </span>
            <span className="col-span-2">
              {new Date(employee.lastActivity).toLocaleString()}
            </span>
          </div>
        </div>
        <Button onClick={() => onOpenChange(false)} className="mt-4 w-full">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  )
}
