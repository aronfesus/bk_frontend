"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Pencil, Trash2, Mail, Phone, MapPin } from "lucide-react"
import { Applicant, ApplicantType, ApplicantOrigin } from "@/types/applicant"

interface ApplicantHeaderProps {
  applicant: Applicant
  onEdit: () => void
  onDelete: () => void
  isDeleting?: boolean
}

export function ApplicantHeader({ applicant, onEdit, onDelete, isDeleting }: ApplicantHeaderProps) {
  const getTypeColor = (type: ApplicantType) => {
    switch (type) {
      case ApplicantType.NORMAL:
        return "bg-blue-700"
      case ApplicantType.STUDENT:
        return "bg-green-700"
      case ApplicantType.ELDER:
        return "bg-purple-700"
      default:
        return "bg-gray-500"
    }
  }

  const getOriginColor = (origin: ApplicantOrigin) => {
    switch (origin) {
      case ApplicantOrigin.FACEBOOK:
        return "bg-blue-700"
      case ApplicantOrigin.PHONE:
        return "bg-green-700"
      case ApplicantOrigin.OTHER:
        return "bg-purple-700"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card className="overflow-hidden bg-gray-50/60">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
          {/* Left Section - Profile */}
          <div className="flex flex-col sm:flex-row items-start gap-6 flex-1">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${applicant.name}`} />
                <AvatarFallback className="text-3xl bg-primary/50 text-white">
                  {applicant.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-3">
                <div>
                  <h1 className="text-3xl font-bold text-foreground tracking-tight">
                    {applicant.name}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    ID: #{applicant.applicantId}
                  </p>
                </div>

                {/* Contact Information */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{applicant.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{applicant.phoneNumber}</span>
                  </div>
                  {applicant.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{applicant.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
            <Button 
              onClick={onEdit} 
              variant="outline" 
              className="justify-start"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Szerkesztés
            </Button>
            <Button 
              onClick={onDelete} 
              variant="outline" 
              disabled={isDeleting} 
              className="justify-start group"
            >
              <Trash2 className="mr-2 h-4 w-4 text-destructive group-hover:text-white transition-colors" />
              <span className="text-destructive group-hover:text-white transition-colors">
                {isDeleting ? "Törlés..." : "Törlés"}
              </span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 