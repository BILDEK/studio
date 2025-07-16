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
import { OptimizerForm } from "@/components/optimizer-form"


function OptimizerResult({ state }: { state: OptimizerActionState }) {
  if (state.data) {
    return (
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
    )
  }
  return (
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
  )
}

function OptimizerPageContent() {
  const initialState: OptimizerActionState = {}
  const [state, dispatch] = useFormState(getOptimizedWorkflow, initialState)

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-3">
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
             <OptimizerForm state={state} dispatch={dispatch} />
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <OptimizerResult state={state} />
      </div>
    </div>
  )
}


export default function OptimizerPage() {
  return (
    <AppLayout>
      <OptimizerPageContent />
    </AppLayout>
  )
}
