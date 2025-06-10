"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { applicantsApi } from "@/lib/api/applicants"
import { jobApplicationsApi } from "@/lib/api/job-applications"
import { jobsApi } from "@/lib/api/jobs"
import { messagesApi } from "@/lib/api/messages"
import { callsApi } from "@/lib/api/calls"
import { ApplicantHeader } from "../../../components/applicant-detail/applicant-header"
import { ApplicantBasicInfo } from "../../../components/applicant-detail/applicant-basic-info"
import { ApplicantJobs } from "../../../components/applicant-detail/applicant-jobs"
import { ApplicantCalls } from "../../../components/applicant-detail/applicant-calls"
import { ApplicantMessages } from "../../../components/applicant-detail/applicant-messages"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ApplicantType, ApplicantOrigin } from "@/types/applicant"

// Form validation schema
const applicantFormSchema = z.object({
  name: z.string().min(2, "A név legalább 2 karakter hosszú kell legyen"),
  email: z.string().email("Érvénytelen email cím"),
  phoneNumber: z.string().min(6, "A telefonszám túl rövid"),
  address: z.string().min(4, "A cím túl rövid"),
  dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Érvénytelen dátum",
  }),
  applicantType: z.nativeEnum(ApplicantType, {
    required_error: "Válassz típust",
  }),
  origin: z.nativeEnum(ApplicantOrigin, {
    required_error: "Válassz forrást",
  }),
  hasEKG: z.boolean().default(false),
})

type ApplicantFormValues = z.infer<typeof applicantFormSchema>

export default function ApplicantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const applicantId = params.id as string
  const [showEditDialog, setShowEditDialog] = useState(false)

  // Get applicant details
  const { data: applicant, isLoading: isLoadingApplicant, error: applicantError } = useQuery({
    queryKey: ["applicant", applicantId],
    queryFn: () => applicantsApi.getApplicantById(applicantId),
    enabled: !!applicantId,
  })

  // Get job applications
  const { data: jobApplications = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ["jobApplications", applicantId],
    queryFn: () => jobApplicationsApi.getApplicationsByApplicant(applicantId),
    enabled: !!applicantId,
  })

  // Get all jobs to match with applications
  const { data: allJobsData } = useQuery({
    queryKey: ["allJobs"],
    queryFn: () => jobsApi.getJobsPaginated(1, 100), // Get all jobs
  })

  // Get calls by searching for applicant's phone number
  const { data: callsData, isLoading: isLoadingCalls } = useQuery({
    queryKey: ["applicantCalls", applicant?.phoneNumber],
    queryFn: () => applicant?.phoneNumber 
      ? callsApi.getCalls(1, 50, applicant.phoneNumber)
      : Promise.resolve({ calls: [], total: 0 }),
    enabled: !!applicant?.phoneNumber,
  })

  // Get messages
  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["applicantMessages", applicantId],
    queryFn: () => messagesApi.getMessagesByApplicantIdPaginated(applicantId, 1, 20),
    enabled: !!applicantId,
  })

  // Edit form
  const editForm = useForm<ApplicantFormValues>({
    resolver: zodResolver(applicantFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      address: '',
      dateOfBirth: '',
      applicantType: ApplicantType.NORMAL,
      origin: ApplicantOrigin.OTHER,
      hasEKG: false,
    },
  })

  // Update form when applicant data loads
  useEffect(() => {
    if (applicant) {
      editForm.reset({
        name: applicant.name || '',
        email: applicant.email || '',
        phoneNumber: applicant.phoneNumber || '',
        address: applicant.address || '',
        dateOfBirth: applicant.dateOfBirth ? new Date(applicant.dateOfBirth).toISOString().split('T')[0] : '',
        applicantType: applicant.applicantType || ApplicantType.NORMAL,
        origin: applicant.origin || ApplicantOrigin.OTHER,
        hasEKG: applicant.hasEKG || false,
      })
    }
  }, [applicant, editForm])

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: ApplicantFormValues) => {
      const { dateOfBirth, ...rest } = data
      const updateData: any = {
        ...rest,
        type: data.applicantType,
      }

      if (dateOfBirth && !isNaN(Date.parse(dateOfBirth))) {
        updateData.dateOfBirth = new Date(dateOfBirth)
      }
      
      return applicantsApi.updateApplicant(applicantId, updateData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applicant", applicantId] })
      queryClient.invalidateQueries({ queryKey: ["applicants"] })
      setShowEditDialog(false)
      toast.success("Jelentkező sikeresen frissítve")
    },
    onError: () => {
      toast.error("Hiba történt a frissítés során")
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => applicantsApi.deleteApplicant(applicantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applicants"] })
      toast.success("Jelentkező törölve")
      router.push("/applicants")
    },
    onError: () => {
      toast.error("Hiba történt a törlés során")
    },
  })

  const handleEdit = () => {
    setShowEditDialog(true)
  }

  const handleUpdate = (values: ApplicantFormValues) => {
    updateMutation.mutate(values)
  }

  const handleDelete = () => {
    if (confirm("Biztosan törölni szeretnéd ezt a jelentkezőt?")) {
      deleteMutation.mutate()
    }
  }

  const handleBack = () => {
    router.push("/applicants")
  }

  if (applicantError) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Hiba történt</h1>
          <p className="text-muted-foreground mt-2">A jelentkező adatai nem tölthetők be.</p>
          <Button onClick={handleBack} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Vissza a listához
          </Button>
        </div>
      </div>
    )
  }

  if (isLoadingApplicant) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!applicant) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Jelentkező nem található</h1>
          <p className="text-muted-foreground mt-2">A keresett jelentkező nem létezik.</p>
          <Button onClick={handleBack} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Vissza a listához
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="container mx-auto p-6 space-y-6">
        {/* Navigation */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Vissza
          </Button>
        </div>
  
        {/* Header Section */}
        <ApplicantHeader 
          applicant={applicant} 
          onEdit={handleEdit}
          onDelete={handleDelete}
          isDeleting={deleteMutation.isPending}
        />
  
        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <ApplicantBasicInfo applicant={applicant} />
  
          {/* Job Applications */}
          <ApplicantJobs 
            jobApplications={jobApplications}
            allJobs={allJobsData?.jobs || []}
            isLoading={isLoadingJobs}
          />
        </div>
  
        {/* Communication History */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Call History */}
          <ApplicantCalls 
            calls={callsData?.calls || []}
            isLoading={isLoadingCalls}
            totalCalls={callsData?.total || 0}
          />
  
          {/* Message History */}
          <ApplicantMessages 
            messages={messagesData?.messages || []}
            isLoading={isLoadingMessages}
            totalMessages={messagesData?.total || 0}
            applicantId={applicantId}
          />
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Jelentkező szerkesztése</DialogTitle>
            <DialogDescription>A jelentkező adatainak módosítása.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="grid gap-4 py-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Név</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefonszám</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lakhely</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Születési dátum</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="applicantType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jelentkező típusa</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Válassz típust" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ApplicantType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forrás</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Válassz forrást" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ApplicantOrigin).map((origin) => (
                            <SelectItem key={origin} value={origin}>
                              {origin}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="hasEKG"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </FormControl>
                    <FormLabel>Rendelkezik EÜ Kiskönyvvel</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Mégsem
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Mentés..." : "Mentés"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
} 