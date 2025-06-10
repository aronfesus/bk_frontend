"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Pencil, Trash2, PhoneCall } from "lucide-react"
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

  const handleCall = () => {
    if (applicant.phoneNumber) {
      window.open(`tel:${applicant.phoneNumber}`)
    }
  }

  return (
    <Card className="overflow-hidden shadow-sm border-blue-100 dark:border-blue-900/50">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-6 justify-between items-start">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-white dark:border-slate-800 shadow-lg">
              <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${applicant.name}`} />
              <AvatarFallback className="text-3xl bg-slate-200 dark:bg-slate-700">
                {applicant.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{applicant.name}</h1>
              <p className="text-lg text-muted-foreground">{applicant.email}</p>
              
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Badge variant="secondary">{applicant.applicantType}</Badge>
                <Badge variant="secondary">{applicant.origin}</Badge>
                {applicant.hasEKG && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800/60">
                    EÜ Kiskönyv
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-2 shrink-0">
            <Button onClick={onEdit} variant="outline" className="justify-start">
              <Pencil className="mr-2 h-4 w-4" />
              Szerkesztés
            </Button>
            <Button onClick={onDelete} variant="outline" disabled={isDeleting} className="justify-start group">
              <Trash2 className="mr-2 h-4 w-4 text-destructive group-hover:text-white transition-colors" />
              <span className="text-destructive group-hover:text-white transition-colors">
                {isDeleting ? "Törlés..." : "Törlés"}
              </span>
            </Button>
            <Button onClick={handleCall} className="bg-blue-600 hover:bg-blue-700 text-white justify-start">
              <PhoneCall className="mr-2 h-4 w-4" />
              Hívás
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 