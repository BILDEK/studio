
"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  type User,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, getDocs, updateDoc, doc, addDoc } from "firebase/firestore"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Moon, Sun, Monitor, Upload } from "lucide-react"

function AccountSettings() {
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [employeeDocId, setEmployeeDocId] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        setEmail(currentUser.email || "")

        try {
          let q = query(collection(db, "employees"), where("email", "==", currentUser.email))
          let querySnapshot = await getDocs(q)

          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0]
            setEmployeeDocId(userDoc.id)
            setName(userDoc.data().name || "")
            setAvatarUrl(userDoc.data().avatar)
          } else {
            q = query(collection(db, "test0"), where("email", "==", currentUser.email))
            querySnapshot = await getDocs(q)

            if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0]
              setEmployeeDocId(userDoc.id)
              setName(userDoc.data().name || "")
              setAvatarUrl(userDoc.data().avatar)
            } else {
              setName(currentUser.displayName || "")
              setAvatarUrl(undefined)
            }
          }
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error)
          setName(currentUser.displayName || "")
          setAvatarUrl(undefined)
        }
      } else {
        setUser(null)
        setName("")
        setEmail("")
        setAvatarUrl(undefined)
        setEmployeeDocId(null)
      }
    })

    return () => unsubscribe()
  }, [])

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
      return new Promise((resolve, reject) => {
          const img = document.createElement("img");
          const reader = new FileReader();

          reader.onload = (e) => {
              if (typeof e.target?.result !== 'string') {
                  return reject(new Error('File could not be read.'));
              }
              img.src = e.target.result;
          };
          reader.onerror = reject;

          img.onload = () => {
              const canvas = document.createElement("canvas");
              let { width, height } = img;

              if (width > height) {
                  if (width > maxWidth) {
                      height = Math.round(height * (maxWidth / width));
                      width = maxWidth;
                  }
              } else {
                  if (height > maxHeight) {
                      width = Math.round(width * (maxHeight / height));
                      height = maxHeight;
                  }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              if (!ctx) {
                  return reject(new Error('Could not get canvas context.'));
              }
              ctx.drawImage(img, 0, 0, width, height);

              // Get the data URL with JPEG format for better compression
              resolve(canvas.toDataURL("image/jpeg", 0.9)); // 0.9 is the quality level
          };

          reader.readAsDataURL(file);
      });
  };

 const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingAvatar(true);
    try {
        // Resize the image before processing
        const dataUrl = await resizeImage(file, 800, 800);

        if (employeeDocId) {
            let docRef;
             try {
                 docRef = doc(db, "employees", employeeDocId);
                 await getDoc(docRef);
             } catch (e) {
                 docRef = doc(db, "test0", employeeDocId);
             }
            await updateDoc(docRef, { avatar: dataUrl });
        } else {
            if (!user.email) throw new Error("User email not found");
            const newDocRef = await addDoc(collection(db, "test0"), {
                email: user.email,
                name: name || user.displayName || "",
                avatar: dataUrl,
            });
            setEmployeeDocId(newDocRef.id);
        }
        
        setAvatarUrl(dataUrl);
        toast({ title: "Success", description: "Avatar updated successfully!" });
    } catch (error) {
        console.error("Error saving avatar:", error);
        toast({ variant: "destructive", title: "Update Failed", description: `There was an error saving your new avatar: ${error}` });
    } finally {
        setIsUploadingAvatar(false);
    }
};

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to update your profile." })
      return
    }

    setIsSubmitting(true)

    try {
      if (name !== (user.displayName || "")) {
        await updateProfile(user, { displayName: name })
         if (employeeDocId) {
            const docRef = doc(db, "test0", employeeDocId)
            await updateDoc(docRef, { name: name })
        } else {
             if (!user.email) throw new Error("User email not found");
             const newDocRef = await addDoc(collection(db, "test0"), {
                email: user.email,
                name: name,
            });
            setEmployeeDocId(newDocRef.id);
        }
        toast({ title: "Success", description: "Your name has been updated." })
      }

      if (newPassword && currentPassword) {
        const credential = EmailAuthProvider.credential(user.email!, currentPassword)
        await reauthenticateWithCredential(user, credential)
        await updatePassword(user, newPassword)
        toast({ title: "Success", description: "Your password has been updated." })
        setCurrentPassword("")
        setNewPassword("")
      } else if (newPassword && !currentPassword) {
        toast({ variant: "destructive", title: "Error", description: "Please enter your current password to set a new one." })
      }
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred."
      if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect current password. Please try again."
      } else if (error.code === "auth/weak-password") {
        errorMessage = "The new password is too weak."
      }
      toast({ variant: "destructive", title: "Update Failed", description: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getInitials = (nameStr: string | null) => {
    if (!nameStr) return ""
    return nameStr.split(" ").map((n) => n[0]).join("").toUpperCase()
  }

  return (
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
            <AvatarImage src={avatarUrl} alt="@user" />
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          </Avatar>
           <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} accept="image/jpeg, image/png" style={{ display: "none" }} />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold">{name || "No Name"}</h2>
            <p className="text-muted-foreground">{user?.email}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => avatarInputRef.current?.click()} disabled={isUploadingAvatar}>
                {isUploadingAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} 
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
            <Button variant="outline" type="button" onClick={() => { /* reset */ }}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function AppearanceSettings() {
  // ... (unchanged)
    const [activeTheme, setActiveTheme] = useState("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const currentClass = document.documentElement.className
    if (currentClass === "dark" || currentClass === "cyber-punk") {
      setActiveTheme(currentClass)
    } else {
      setActiveTheme("light")
    }
  }, [])

  const handleThemeChange = (newTheme: string) => {
    const themeClass = newTheme === "light" ? "" : newTheme
    document.documentElement.className = themeClass
    setActiveTheme(newTheme)
  }

  if (!mounted) {
    return <div>Loading...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Select a theme for your dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row">
        <Button
          variant="theme"
          className="w-full justify-center"
          onClick={() => handleThemeChange("light")}
          data-state={activeTheme === "light" ? "active" : "inactive"}
        >
          <Sun className="mr-2 h-4 w-4" /> Light
        </Button>
        <Button
          variant="theme"
          className="w-full justify-center"
          onClick={() => handleThemeChange("dark")}
          data-state={activeTheme === "dark" ? "active" : "inactive"}
        >
          <Moon className="mr-2 h-4 w-4" /> Dark
        </Button>
        <Button
          variant="theme"
          className="w-full justify-center"
          onClick={() => handleThemeChange("cyber-punk")}
          data-state={activeTheme === "cyber-punk" ? "active" : "inactive"}
        >
          <Monitor className="mr-2 h-4 w-4" /> Cyberpunk
        </Button>
      </CardContent>
    </Card>
  )
}

function ProfilePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tab = searchParams.get("tab") || "account"
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(false)
  }, [])
  
  const onTabChange = (value: string) => {
    router.push(`/profile?tab=${value}`, { scroll: false });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and appearance preferences.
        </p>
      </div>
      <Tabs defaultValue={tab} value={tab} onValueChange={onTabChange} className="w-full">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        <TabsContent value="account" className="mt-6">
          <AccountSettings />
        </TabsContent>
        <TabsContent value="appearance" className="mt-6">
          <AppearanceSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <AppLayout>
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <ProfilePageContent />
      </Suspense>
    </AppLayout>
  )
}
