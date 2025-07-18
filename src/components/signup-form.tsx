"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { VerdantFlowLogo } from "@/components/icons"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export function SignupForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      // Optionally, you could also update the user's profile with their name here
      router.push("/dashboard")
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred. Please try again."
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email address is already in use."
      } else if (error.code === "auth/weak-password") {
        errorMessage = "The password is too weak. Please choose a stronger password."
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address."
      }

      toast({
        variant: "destructive",
        title: "Sign-up Failed",
        description: errorMessage,
      })
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <form onSubmit={handleSignup}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <VerdantFlowLogo className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>
            Enter your details to get started with VerdantFlow.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Jane Doe"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full">
            Sign Up
          </Button>
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/" className="underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
