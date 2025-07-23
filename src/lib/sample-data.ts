
import { Task } from "@/app/tasks/page";

export const sampleTasks: Omit<Task, "id" | "assigneeId">[] = [
  {
    title: "Finalize Q3 Marketing Campaign",
    description: "Review and approve the final assets for the upcoming campaign.",
    assignee: "Noah Brown",
    dueDate: new Date("2024-08-15"),
    priority: "High" as const,
    avatar: "https://placehold.co/100x100/A7F3D0/064E3B.png",
    status: "todo" as const,
  },
  {
    title: "Develop new landing page mockups",
    description: "Create three different versions of the landing page for A/B testing.",
    assignee: "Peter Jones",
    dueDate: new Date("2024-08-10"),
    priority: "Medium" as const,
    avatar: "https://placehold.co/100x100/34D399/065F46.png",
    status: "todo" as const,
  },
  {
    title: "Refactor authentication module",
    description: "Improve security and performance of the user authentication flow.",
    assignee: "John Smith",
    dueDate: new Date("2024-08-05"),
    priority: "High" as const,
    avatar: "https://placehold.co/100x100/6EE7B7/047857.png",
    status: "inProgress" as const,
  },
  {
    title: "Plan project kickoff meeting",
    description: "Prepare agenda and presentation slides for the new project kickoff.",
    assignee: "Jane Doe",
    dueDate: new Date("2024-07-28"),
    priority: "Low" as const,
    avatar: "https://placehold.co/100x100/A3E635/4D7C0F.png",
    status: "done" as const,
  },
  {
    title: "Onboard new marketing intern",
    description: "Create an onboarding plan and schedule introduction meetings.",
    assignee: "Noah Brown",
    dueDate: new Date("2024-07-25"),
    priority: "Medium" as const,
    avatar: "https://placehold.co/100x100/A7F3D0/064E3B.png",
    status: "done" as const,
  },
]
