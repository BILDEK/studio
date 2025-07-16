"use client"

import { type OptimizerActionState } from "@/lib/actions"
import { useFormStatus } from "react-dom"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Loader2, Wand2 } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
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

interface OptimizerFormProps {
  state: OptimizerActionState
  formAction: (payload: FormData) => void
}

export function OptimizerForm({ state, formAction }: OptimizerFormProps) {
  return (
    <form action={formAction} className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor="workflowDescription">Current Workflow</Label>
        <Textarea
          id="workflowDescription"
          name="workflowDescription"
          placeholder="e.g., When a new customer order is received via email, our team manually enters the order details into a spreadsheet. We then check our physical inventory to confirm stock levels. After that, a shipping label is created using a third-party website, and we email the customer with the tracking number."
          rows={5}
          required
          className="bg-muted/50"
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
          placeholder="e.g., Our primary goal is to reduce order processing time to under 1 hour. We also want to decrease shipping errors by 50% and improve overall customer satisfaction by providing faster, more accurate updates."
          rows={3}
          required
          className="bg-muted/50"
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
          placeholder="e.g., Manual data entry is time-consuming and often leads to typos in customer addresses. Our inventory counts are frequently inaccurate, causing delays. Crafting individual emails for tracking numbers is slow and repetitive."
          rows={3}
          required
          className="bg-muted/50"
        />
        {state.errors?.currentChallenges && (
          <p className="text-sm font-medium text-destructive">
            {state.errors.currentChallenges[0]}
          </p>
        )}
      </div>
      <div className="flex items-center gap-4">
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
