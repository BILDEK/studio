"use client"

import { getOptimizedWorkflow, type OptimizerActionState } from "@/lib/actions"
import { useFormState } from "react-dom"
import { AppLayout } from "@/components/app-layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Wand2, Lightbulb, CheckCircle2 } from "lucide-react"

function OptimizerForm() {
  const initialState: OptimizerActionState = {}
  const [state, dispatch] = useFormState(getOptimizedWorkflow, initialState)

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              <span>Workflow Optimizer</span>
            </CardTitle>
            <CardDescription>
              Use AI to analyze your processes and get actionable suggestions for improvement.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <form action={dispatch} className="grid gap-6">
              <div className="grid gap-2">
                <label htmlFor="workflowDescription" className="text-sm font-medium">Current Workflow</label>
                <textarea
                  id="workflowDescription"
                  name="workflowDescription"
                  placeholder="Describe your current process from start to finish. e.g., 'When a new order comes in...'"
                  rows={5}
                  required
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {state.errors?.workflowDescription && (
                  <p className="text-sm font-medium text-destructive">
                    {state.errors.workflowDescription[0]}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <label htmlFor="businessGoals" className="text-sm font-medium">Business Goals</label>
                <textarea
                  id="businessGoals"
                  name="businessGoals"
                  placeholder="What are the key objectives for this workflow? e.g., 'Reduce shipping errors...'"
                  rows={3}
                  required
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {state.errors?.businessGoals && (
                  <p className="text-sm font-medium text-destructive">
                    {state.errors.businessGoals[0]}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <label htmlFor="currentChallenges" className="text-sm font-medium">Current Challenges</label>
                <textarea
                  id="currentChallenges"
                  name="currentChallenges"
                  placeholder="What are the main pain points? e.g., 'Inventory counts are often inaccurate...'"
                  rows={3}
                  required
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {state.errors?.currentChallenges && (
                  <p className="text-sm font-medium text-destructive">
                    {state.errors.currentChallenges[0]}
                  </p>
                )}
              </div>
              <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full sm:w-auto">
                <Wand2 className="mr-2 h-4 w-4" />
                Get Suggestions
              </button>
              {state.message && !state.data && (
                 <p className={`text-sm ${state.errors ? 'text-destructive' : 'text-muted-foreground'}`}>
                   {state.message}
                 </p>
               )}
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3">
        {state.data ? (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  <span>Optimized Workflow Suggestions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>{state.data.optimizedWorkflowSuggestions}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>Potential Benefits</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>{state.data.potentialBenefits}</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="flex min-h-[400px] flex-col items-center justify-center text-center p-6">
             <div className="rounded-full border border-dashed p-4">
                <div className="rounded-full bg-muted p-4">
                    <Lightbulb className="h-10 w-10 text-muted-foreground" />
                </div>
            </div>
            <CardTitle className="mt-6 text-xl">AI-Powered Suggestions</CardTitle>
            <CardDescription className="mt-2 max-w-xs">
              Fill out the form to receive AI-powered recommendations for improving your workflow.
            </CardDescription>
          </Card>
        )}
      </div>
    </div>
  )
}


export default function OptimizerPage() {
  return (
    <AppLayout>
      <OptimizerForm />
    </AppLayout>
  )
}
