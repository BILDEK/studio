"use client"

import { getOptimizedWorkflow, type OptimizerActionState } from "@/lib/actions"
import { useFormState, useFormStatus } from "react-dom"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Loader2, Wand2 } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Optimizing...
        </>
      ) : (
        <>
          <Wand2 className="mr-2 h-4 w-4" />
          Get Suggestions
        </>
      )}
    </Button>
  )
}

export function OptimizerForm() {
  const initialState: OptimizerActionState = {}
  const [state, dispatch] = useFormState(getOptimizedWorkflow, initialState)

  return (
    <form action={dispatch} className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor="workflowDescription">Current Workflow</Label>
        <Textarea
          id="workflowDescription"
          name="workflowDescription"
          placeholder="Describe your current process from start to finish. For example: 'When a new order comes in, we manually check inventory, then create a shipping label, and finally email the customer with a tracking number.'"
          rows={5}
          required
        />
        {state.errors?.workflowDescription && (
          <p className="text-sm font-medium text-destructive">
            {state.errors.workflowDescription[0]}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="businessGoals">Business Goals</Label>
        <Textarea
          id="businessGoals"
          name="businessGoals"
          placeholder="What are the key objectives for this workflow? For example: 'Reduce shipping errors by 50% and decrease order processing time to under 2 hours.'"
          rows={3}
          required
        />
        {state.errors?.businessGoals && (
          <p className="text-sm font-medium text-destructive">
            {state.errors.businessGoals[0]}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="currentChallenges">Current Challenges</Label>
        <Textarea
          id="currentChallenges"
          name="currentChallenges"
          placeholder="What are the main pain points or bottlenecks? For example: 'Inventory counts are often inaccurate, and manually creating emails is time-consuming and leads to typos.'"
          rows={3}
          required
        />
        {state.errors?.currentChallenges && (
          <p className="text-sm font-medium text-destructive">
            {state.errors.currentChallenges[0]}
          </p>
        )}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SubmitButton />
        {state.message && !state.data && (
           <p className={`text-sm ${state.errors ? 'text-destructive' : 'text-muted-foreground'}`}>
             {state.message}
           </p>
         )}
      </div>
    </form>
  )
}
