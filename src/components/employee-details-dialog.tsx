
"use client"

import * as React from "react"
import { useState, useEffect } from "react"
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
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock } from "lucide-react"

interface StatusHistory {
  id: string
  employeeId: string
  employeeName: string
  previousStatus: string
  newStatus: string
  timestamp: Date
  changedBy: string
}

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
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  useEffect(() => {
    if (isOpen && employee.id) {
      fetchStatusHistory()
    }
  }, [isOpen, employee.id])

  const fetchStatusHistory = async () => {
    setIsLoadingHistory(true)
    try {
      const historyRef = collection(db, "statusHistory")
      const q = query(
        historyRef,
        where("employeeId", "==", employee.id),
        orderBy("timestamp", "desc")
      )
      const querySnapshot = await getDocs(q)
      const historyData = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp)
        } as StatusHistory
      })
      setStatusHistory(historyData)
    } catch (error) {
      console.error("Error fetching status history:", error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

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

  const formatLastActivity = (activity: Date | string) => {
    if (activity instanceof Date) {
      return activity.toLocaleString();
    }
    return activity;
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
                ? employee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                : "???"}
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
              {formatLastActivity(employee.lastActivity)}
            </span>
          </div>
        </div>

        <Separator className="my-4" />
        
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Status History
          </h3>
          {isLoadingHistory ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading history...</p>
          ) : statusHistory.length > 0 ? (
            <ScrollArea className="h-[200px] rounded-md border p-3">
              <div className="space-y-3">
                {statusHistory.map((history) => (
                  <div key={history.id} className="text-sm border-l-2 border-primary/20 pl-3 pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground line-through">{history.previousStatus}</span>
                        <span>→</span>
                        {getStatusBadge(history.newStatus)}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {history.timestamp.toLocaleString()} • by {history.changedBy}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No status changes recorded.</p>
          )}
        </div>

        <Button onClick={() => onOpenChange(false)} className="mt-4 w-full">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  )
}
