import { AppLayout } from "@/components/app-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle } from "lucide-react"

const tasks = {
  todo: [
    {
      id: "task-1",
      title: "Finalize Q3 Marketing Campaign",
      assignee: "Noah Brown",
      dueDate: "2024-08-15",
      priority: "High",
      avatar: "https://placehold.co/100x100/A7F3D0/064E3B.png",
    },
    {
      id: "task-2",
      title: "Develop new landing page mockups",
      assignee: "Emma Williams",
      dueDate: "2024-08-10",
      priority: "Medium",
      avatar: "https://placehold.co/100x100/34D399/065F46.png",
    },
  ],
  inProgress: [
    {
      id: "task-3",
      title: "Refactor authentication module",
      assignee: "Liam Johnson",
      dueDate: "2024-08-05",
      priority: "High",
      avatar: "https://placehold.co/100x100/6EE7B7/047857.png",
    },
  ],
  done: [
    {
      id: "task-4",
      title: "Plan project kickoff meeting",
      assignee: "Olivia Martin",
      dueDate: "2024-07-28",
      priority: "Low",
      avatar: "https://placehold.co/100x100/A3E635/4D7C0F.png",
    },
    {
      id: "task-5",
      title: "Onboard new marketing intern",
      assignee: "Noah Brown",
      dueDate: "2024-07-25",
      priority: "Medium",
      avatar: "https://placehold.co/100x100/A7F3D0/064E3B.png",
    },
  ],
}

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "High":
      return <Badge variant="destructive">High</Badge>
    case "Medium":
      return <Badge className="bg-yellow-500 hover:bg-yellow-500/80">Medium</Badge>
    case "Low":
      return <Badge variant="secondary">Low</Badge>
    default:
      return <Badge variant="outline">{priority}</Badge>
  }
}

const TaskCard = ({ task }: { task: (typeof tasks.todo)[0] }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">{task.title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={task.avatar} data-ai-hint="profile picture" />
            <AvatarFallback>{task.assignee.charAt(0)}</AvatarFallback>
          </Avatar>
          <span>{task.assignee}</span>
        </div>
        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
      </div>
    </CardContent>
    <CardFooter>
      {getPriorityBadge(task.priority)}
    </CardFooter>
  </Card>
)

export default function TasksPage() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </div>

        <Tabs defaultValue="todo" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="todo">To Do</TabsTrigger>
            <TabsTrigger value="inProgress">In Progress</TabsTrigger>
            <TabsTrigger value="done">Done</TabsTrigger>
          </TabsList>
          <TabsContent value="todo">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tasks.todo.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="inProgress">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tasks.inProgress.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="done">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tasks.done.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
