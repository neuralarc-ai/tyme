"use client"

import { useState, useEffect } from "react"
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
import { CalendarIcon } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface InviteDialogProps {
  meetingTime: string
  meetingDate: string
  timezone: string
}

export function InviteDialog({ meetingTime, meetingDate, timezone }: InviteDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [linkOption, setLinkOption] = useState<'paste' | 'generate'>('paste')
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [formData, setFormData] = useState({
    senderName: "",
    senderEmail: "",
    recipientEmails: "",
    description: "",
    meetingLink: ""
  })
  const { toast } = useToast()

  // Function to create a Google Calendar event and get a valid Meet link
  const createGoogleMeetEvent = async () => {
    setIsGeneratingLink(true)
    try {
      const response = await fetch('/api/generate-meet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: "Meeting Invitation",
          description: formData.description,
          startTime: `${meetingDate} ${meetingTime}`,
          timezone: timezone
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to create meeting")
      }

      setFormData(prev => ({
        ...prev,
        meetingLink: data.meetLink
      }))
      return data.meetLink
    } catch (error) {
      console.error("Error creating meeting:", error)
      throw new Error("Failed to create Google Meet link")
    } finally {
      setIsGeneratingLink(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate form data
      if (!formData.senderName || !formData.senderEmail || !formData.recipientEmails) {
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

      // Validate meeting link
      if (!formData.meetingLink) {
        throw new Error("Please provide a meeting link")
      }

      // If generate option is selected and no link exists, generate one
      let meetLink = formData.meetingLink
      if (linkOption === 'generate' && !formData.meetingLink) {
        meetLink = await createGoogleMeetEvent()
      }

      // Send invitation email
      const response = await fetch('/api/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          meetingLink: meetLink,
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
      setLinkOption('paste')
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
        <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md">
          <CalendarIcon className="mr-2 h-4 w-4" />
          Send Invitations
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] backdrop-blur-md bg-black/40 border border-white/20 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Send Meeting Invitations</DialogTitle>
          <DialogDescription className="text-white/70">
            Send meeting invitations to participants. All fields are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Meeting Time Display */}
          <div className="backdrop-blur-sm bg-black/30 p-4 rounded-lg border border-white/10">
            <h4 className="font-medium mb-2 text-white">Meeting Details</h4>
            <p className="text-sm text-white/70">Date: {meetingDate}</p>
            <p className="text-sm text-white/70">Time: {meetingTime} {timezone}</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senderName" className="text-white/70">Your Name</Label>
              <Input
                id="senderName"
                value={formData.senderName}
                onChange={(e) => setFormData(prev => ({ ...prev, senderName: e.target.value }))}
                placeholder="John Doe"
                required
                className="bg-white/5 border-white/20 text-white backdrop-blur-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senderEmail" className="text-white/70">Your Email</Label>
              <Input
                id="senderEmail"
                type="email"
                value={formData.senderEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, senderEmail: e.target.value }))}
                placeholder="you@example.com"
                required
                className="bg-white/5 border-white/20 text-white backdrop-blur-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientEmails" className="text-white/70">Recipient Emails</Label>
              <Input
                id="recipientEmails"
                value={formData.recipientEmails}
                onChange={(e) => setFormData(prev => ({ ...prev, recipientEmails: e.target.value }))}
                placeholder="participant1@example.com, participant2@example.com"
                required
                className="bg-white/5 border-white/20 text-white backdrop-blur-sm"
              />
              <p className="text-sm text-white/50">Separate multiple emails with commas</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white/70">Meeting Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter meeting agenda or description..."
                required
                className="min-h-[100px] bg-white/5 border-white/20 text-white backdrop-blur-sm"
              />
            </div>

            <div className="space-y-4">
              <Label className="text-white/70">Meeting Link Option</Label>
              <RadioGroup
                value={linkOption}
                onValueChange={(value) => {
                  setLinkOption(value as 'paste' | 'generate')
                  setFormData(prev => ({ ...prev, meetingLink: '' }))
                }}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="paste" id="paste" className="border-white/20" />
                  <Label htmlFor="paste" className="text-white/70">Paste Meeting Link</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="generate" id="generate" className="border-white/20" />
                  <Label htmlFor="generate" className="text-white/70">Generate Google Meet Link</Label>
                </div>
              </RadioGroup>

              <div className="space-y-2">
                <Label htmlFor="meetingLink" className="text-white/70">Meeting Link</Label>
                {linkOption === 'paste' ? (
                  <Input
                    id="meetingLink"
                    value={formData.meetingLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
                    placeholder="Paste your meeting link here"
                    required
                    className="bg-white/5 border-white/20 text-white backdrop-blur-sm"
                  />
                ) : (
                  <div className="space-y-2">
                    <Input
                      id="meetingLink"
                      value={formData.meetingLink}
                      readOnly
                      placeholder="Click generate to create a meeting link"
                      className="bg-white/5 border-white/20 text-white backdrop-blur-sm"
                    />
                    <Button
                      type="button"
                      onClick={createGoogleMeetEvent}
                      disabled={isGeneratingLink}
                      className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20"
                    >
                      {isGeneratingLink ? (
                        <>
                          <span className="mr-2">Generating...</span>
                          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        </>
                      ) : (
                        "Generate Meeting Link"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || (linkOption === 'generate' && !formData.meetingLink)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
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