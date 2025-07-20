"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Briefcase, Calendar, MapPin, DollarSign } from "lucide-react"
import { JobApplication } from "@/types/job-application"
import { Job } from "@/types/job"

interface ApplicantJobsProps {
  jobApplications: JobApplication[]
  allJobs: Job[]
  isLoading: boolean
}

export function ApplicantJobs({ jobApplications, allJobs, isLoading }: ApplicantJobsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hu-HU')
  }

  if (isLoading) {
    return (
      <Card className="bg-gray-50/60">
        <CardHeader className="border-b bg-gray-200/40">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            Jelentkezések
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-3 rounded-lg border p-4">
              <Skeleton className="h-5 w-3/4" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-50/60">
      <CardHeader className="border-b -mt-6 p-4 bg-gray-200/40">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          Jelentkezések ({jobApplications.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {jobApplications.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500 mb-4" />
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">Nincs jelentkezés</h3>
            <p className="text-sm text-muted-foreground mt-1">A jelentkező még nem pályázott egyetlen munkára sem.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobApplications.map((application, index) => {
              const job = application.job || allJobs.find(j => j.jobId === application.job_id)
              
              return (
              <div
                key={application.job_id || index}
                className="border rounded-lg p-4 space-y-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <h4 className="font-semibold text-base text-slate-800 dark:text-slate-100">
                      {job?.title || "Munka címe"}
                    </h4>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {job?.jobPlace && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{job.jobPlace}</span>
                        </div>
                      )}

                      {job?.salary && (
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5" />
                          <span>{job.salary}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Jelentkezés: {formatDate(application.application_date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {job?.isActive !== undefined && (
                      <Badge variant={job.isActive ? "default" : "secondary"} className={job.isActive ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60" : ""}>
                        {job.isActive ? "Aktív" : "Inaktív"}
                      </Badge>
                    )}
                     {job?.jobType && (
                      <Badge variant="outline">
                        {job.jobType}
                      </Badge>
                    )}
                  </div>
                </div>

                {job?.description && (
                  <p className="text-sm text-muted-foreground pt-2 border-t mt-3">
                    {job.description}
                  </p>
                )}
              </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 