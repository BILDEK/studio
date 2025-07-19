
"use client"

import { useEffect, useState } from "react"
import {
  type User,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"


import { AppLayout } from "@/components/app-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function ProfilePage() {
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [employeeDocId, setEmployeeDocId] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        setEmail(currentUser.email || "")
        try {
          const q = query(collection(db, "test0"), where("email", "==", currentUser.email));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            setEmployeeDocId(userDoc.id);
            setName(userDoc.data().name || "");
          } else {
            setName(currentUser.displayName || ""); // Fallback
          }
        } catch (error) {
           console.error("Error fetching user name from Firestore:", error);
           setName(currentUser.displayName || ""); // Fallback
        }
      }
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to update your profile.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Update name in Firestore
      if (employeeDocId) {
        const userDocRef = doc(db, "test0", employeeDocId);
        await updateDoc(userDocRef, { name: name });
        toast({
          title: "Success",
          description: "Your name has been updated.",
        });
      }

      // Update password if a new password is provided
      if (newPassword && currentPassword) {
        const credential = EmailAuthProvider.credential(user.email!, currentPassword)
        await reauthenticateWithCredential(user, credential)
        await updatePassword(user, newPassword)
        toast({
          title: "Success",
          description: "Your password has been updated.",
        })
        setCurrentPassword("")
        setNewPassword("")
      } else if (newPassword && !currentPassword) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please enter your current password to set a new one.",
        })
      }
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred."
      if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect current password. Please try again."
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "The new password is too weak."
      }
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return ""
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }
  
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and personal information.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>
              Update your personal information and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.photoURL || "https://placehold.co/100x100.png"} alt="@user" data-ai-hint="profile picture" />
                <AvatarFallback>{getInitials(name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl font-bold">{name || "No Name"}</h2>
                <p className="text-muted-foreground">{user?.email}</p>
                <Button variant="outline" size="sm" className="mt-2" disabled>
                  Change Avatar
                </Button>
              </div>
            </div>
            <Separator className="my-6" />
            <form className="grid gap-6" onSubmit={handleSaveChanges}>
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="disabled:cursor-not-allowed disabled:opacity-70"
                />
              </div>
               <div className="grid gap-2">
                <Label htmlFor="password">Current Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter current password to change"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
               <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => {/* maybe reset form */}}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
