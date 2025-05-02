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
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

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

      // Show success message
      toast({
        title: "Success!",
        description: "Meeting invitations have been sent successfully.",
      })

      // Reset form and close dialog
      setFormData({
        senderName: "",
        senderEmail: "",
        recipientEmails: "",
        description: "",
        meetingLink: ""
      })
      setIsOpen(false)

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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Send Invitations</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Meeting Invitations</DialogTitle>
          <DialogDescription>
            Send meeting invitations to participants. All fields are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {/* Meeting Time Display */}
          <div className="bg-muted p-3 rounded-lg mb-4">
            <h4 className="font-medium mb-2">Meeting Details</h4>
            <p className="text-sm text-muted-foreground">Date: {meetingDate}</p>
            <p className="text-sm text-muted-foreground">Time: {meetingTime} {timezone}</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="senderName">Your Name</Label>
            <Input
              id="senderName"
              value={formData.senderName}
              onChange={(e) => setFormData(prev => ({ ...prev, senderName: e.target.value }))}
              placeholder="John Doe"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="senderEmail">Your Email</Label>
            <Input
              id="senderEmail"
              type="email"
              value={formData.senderEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, senderEmail: e.target.value }))}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="recipientEmails">Recipient Emails</Label>
            <Input
              id="recipientEmails"
              value={formData.recipientEmails}
              onChange={(e) => setFormData(prev => ({ ...prev, recipientEmails: e.target.value }))}
              placeholder="participant1@example.com, participant2@example.com"
              required
            />
            <p className="text-sm text-muted-foreground">Separate multiple emails with commas</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Meeting Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter meeting agenda or description..."
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="meetingLink">Google Meet Link</Label>
            <Input
              id="meetingLink"
              value={formData.meetingLink}
              onChange={(e) => setFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
              placeholder="https://meet.google.com/..."
              required
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
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
      </DialogContent>
    </Dialog>
  )
} 