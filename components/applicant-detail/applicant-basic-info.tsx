"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, MapPin, Calendar, User, Globe } from "lucide-react"
import { Applicant } from "@/types/applicant"

interface ApplicantBasicInfoProps {
  applicant: Applicant
}

export function ApplicantBasicInfo({ applicant }: ApplicantBasicInfoProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString('hu-HU')
  }

  const InfoItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | React.ReactNode }) => (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground mt-0.5">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground">{value}</p>
      </div>
    </div>
  );

  return (
    <Card className="bg-gray-50/60">
      <CardHeader className="border-b -mt-6 p-4 bg-gray-200/40">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <User className="h-4 w-4 text-muted-foreground" />
          Alapadatok
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <InfoItem icon={<Mail size={16} />} label="Email" value={applicant.email} />
          <InfoItem icon={<Phone size={16} />} label="Telefonszám" value={applicant.phoneNumber} />
          <InfoItem icon={<MapPin size={16} />} label="Lakhely" value={applicant.address} />
          {applicant.dateOfBirth && (
            <InfoItem icon={<Calendar size={16} />} label="Születési dátum" value={formatDate(applicant.dateOfBirth)} />
          )}
          <InfoItem icon={<Globe size={16} />} label="Jelentkezés forrása" value={applicant.origin} />
          <InfoItem icon={<User size={16} />} label="Jelentkező típusa" value={applicant.applicantType} />
          
          {applicant.hasEKG && (
            <InfoItem 
              icon={<div className="h-3 w-3 rounded-full bg-green-500"></div>} 
              label="Egészségügyi státusz" 
              value={<span className="font-medium text-green-600 dark:text-green-400">Rendelkezik EÜ Kiskönyvvel</span>} 
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
} 