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
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-300">
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium text-slate-800 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-800 dark:text-slate-100">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          Alapadatok
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
          <InfoItem icon={<Mail size={18} />} label="Email" value={applicant.email} />
          <InfoItem icon={<Phone size={18} />} label="Telefonszám" value={applicant.phoneNumber} />
          <InfoItem icon={<MapPin size={18} />} label="Lakhely" value={applicant.address} />
          {applicant.dateOfBirth && (
            <InfoItem icon={<Calendar size={18} />} label="Születési dátum" value={formatDate(applicant.dateOfBirth)} />
          )}
          <InfoItem icon={<Globe size={18} />} label="Jelentkezés forrása" value={applicant.origin} />
          <InfoItem icon={<User size={18} />} label="Jelentkező típusa" value={applicant.applicantType} />
          
          {applicant.hasEKG && (
            <div className="md:col-span-2">
              <InfoItem 
                icon={<div className="h-3 w-3 rounded-full bg-green-500"></div>} 
                label="Egészségügyi státusz" 
                value={<span className="font-medium text-green-600 dark:text-green-400">Rendelkezik EÜ Kiskönyvvel</span>} 
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 