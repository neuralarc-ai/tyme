"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle2 } from "lucide-react"

interface InviteDialogProps {
  meetingTime: string
  meetingDate: string
  timezone: string
}

export function InviteDialog({ meetingTime, meetingDate, timezone }: InviteDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    senderName: "",
    senderEmail: "",
    recipientEmails: "",
    description: "",
    meetingLink: ""
  })
  const [successMessage, setSuccessMessage] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccessMessage("")

    try {
      // Validate form data
      if (!formData.senderName || !formData.senderEmail || !formData.recipientEmails || !formData.meetingLink) {
        throw new Error("Please fill in all required fields")
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.senderEmail)) {
        throw new Error("Please enter a valid sender email address")
      }

      const recipientEmails = formData.recipientEmails.split(",").map(email => email.trim())
      if (!recipientEmails.every(email => emailRegex.test(email))) {
        throw new Error("Please enter valid recipient email addresses")
      }

      // Validate meeting link format (basic check for Google Meet link)
      if (!formData.meetingLink.includes("meet.google.com")) {
        throw new Error("Please enter a valid Google Meet link")
      }

      const response = await fetch('/api/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          meetingTime,
          meetingDate,
          timezone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to send invitations")
      }

      // Show success message in the dialog
      setSuccessMessage("Meeting invitations have been sent successfully!")
      // Show toast as well (optional)
      toast({
        title: "Success!",
        description: "Meeting invitations have been sent successfully.",
      })

      // Reset form (do not close dialog automatically)
      setFormData({
        senderName: "",
        senderEmail: "",
        recipientEmails: "",
        description: "",
        meetingLink: ""
      })

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitations"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); setSuccessMessage("") }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-black text-white border-white border hover:bg-white hover:text-black transition-colors">Send Invitations</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-black text-white border border-white">
        <DialogHeader>
          <DialogTitle className="text-white">Send Meeting Invitations</DialogTitle>
          <DialogDescription className="text-gray-300">
            Send meeting invitations to participants. All fields are required.
          </DialogDescription>
        </DialogHeader>
        {successMessage ? (
          <div className="flex flex-col items-center justify-center p-6 bg-white text-black rounded-lg text-center">
            <CheckCircle2 className="text-green-500 mb-2 animate-bounce" size={48} />
            <div className="text-2xl font-bold mb-1">Invitations Sent!</div>
            <div className="text-base text-gray-700 mb-4">All participants have received your invitation.</div>
            <Button className="mt-2 bg-black text-white border border-white hover:bg-white hover:text-black transition-colors" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {/* Meeting Time Display */}
          <div className="bg-white text-black p-3 rounded-lg mb-4">
            <h4 className="font-medium mb-2">Meeting Details</h4>
            <p className="text-sm">Date: {meetingDate}</p>
            <p className="text-sm">Time: {meetingTime} {timezone}</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="senderName" className="text-white">Your Name</Label>
            <Input
              id="senderName"
              value={formData.senderName}
              onChange={(e) => setFormData(prev => ({ ...prev, senderName: e.target.value }))}
              placeholder="John Doe"
              required
              className="bg-black text-white border-white border placeholder-gray-400"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="senderEmail" className="text-white">Your Email</Label>
            <Input
              id="senderEmail"
              type="email"
              value={formData.senderEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, senderEmail: e.target.value }))}
              placeholder="you@example.com"
              required
              className="bg-black text-white border-white border placeholder-gray-400"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="recipientEmails" className="text-white">Recipient Emails</Label>
            <Input
              id="recipientEmails"
              value={formData.recipientEmails}
              onChange={(e) => setFormData(prev => ({ ...prev, recipientEmails: e.target.value }))}
              placeholder="participant1@example.com, participant2@example.com"
              required
              className="bg-black text-white border-white border placeholder-gray-400"
            />
            <p className="text-sm text-gray-400">Separate multiple emails with commas</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description" className="text-white">Meeting Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter meeting agenda or description..."
              required
              className="bg-black text-white border-white border placeholder-gray-400"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="meetingLink" className="text-white">Google Meet Link</Label>
            <Input
              id="meetingLink"
              value={formData.meetingLink}
              onChange={(e) => setFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
              placeholder="https://meet.google.com/..."
              required
              className="bg-black text-white border-white border placeholder-gray-400"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" className="bg-black text-white border-white border hover:bg-white hover:text-black transition-colors" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-white text-black border border-white hover:bg-black hover:text-white transition-colors">
              {isLoading ? (
                <>
                  <span className="mr-2">Sending...</span>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                </>
              ) : (
                "Send Invitations"
              )}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
} 