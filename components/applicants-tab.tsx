"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import {
  Search,
  Mail,
  Phone,
  Calendar,
  MapPin,
  FileText,
  Pencil,
  Trash2,
  PhoneCall,
  Plus
} from "lucide-react"
import { Applicant, ApplicantType, ApplicantOrigin } from "@/types/applicant"
import { useQuery } from "@tanstack/react-query"
import { jobsApi } from "@/lib/api/jobs"
import { applicantsApi } from "@/lib/api/applicants"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { jobApplicationsApi } from "@/lib/api/job-applications"
import { JobApplication } from "@/types/job-application"
import { Job } from "@/types/job"

// Add the validation schema
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

export function ApplicantsTab() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalApplicants, setTotalApplicants] = useState(0);
  const [searchTerm, setSearchTerm] = useState("")
  const [jobId, setJobId] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [originFilter, setOriginFilter] = useState("all")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const queryClient = useQueryClient()

  // Reset page to 1 when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, jobId, typeFilter, originFilter]);

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return ''
    return new Date(dateString).toISOString().split('T')[0]
  }

  const viewApplicant = (applicant: Applicant) => {
    router.push(`/applicants/${applicant.applicantId}`)
  }

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

  const { data: paginatedData, isLoading, error } = useQuery({
    queryKey: ["applicants", currentPage, pageSize, searchTerm, jobId, typeFilter, originFilter],
    queryFn: () => applicantsApi.getApplicantsPaginated(
      currentPage, 
      pageSize, 
      searchTerm,
      jobId,
      typeFilter,
      originFilter
    ),
  });

  // Extract applicants from paginated data
  const applicants = paginatedData?.applicants ?? [];
  const total = paginatedData?.total ?? 0;

  // Update total when data changes
  useEffect(() => {
    if (total !== totalApplicants) {
      setTotalApplicants(total);
    }
  }, [total]);

  // Add a query for all job applications
  const { data: allJobApplications = {} } = useQuery<Record<string, JobApplication[]>>({
    queryKey: ["allJobApplications", applicants],
    queryFn: async () => {
      const promises = applicants.map(async (applicant) => {
        const applications = await jobApplicationsApi.getApplicationsByApplicant(applicant.applicantId);
        return [applicant.applicantId, applications];
      });
      const results = await Promise.all(promises);
      return Object.fromEntries(results);
    },
    enabled: applicants.length > 0,
  });

  const { data: jobsData } = useQuery<{ jobs: Job[]; total: number }>({
    queryKey: ["jobs"],
    queryFn: () => jobsApi.getJobsPaginated(1, 100), // Get first 100 jobs for the dropdown
  });

  const jobTitles = useMemo(() => {
    return Array.from(new Set((jobsData?.jobs ?? []).map((job: Job) => job.title))).sort();
  }, [jobsData]);

  // Remove the filteredApplicants since filtering is now handled by the API
  const filteredApplicants = applicants;

  const getMostRecentDate = async (applicantId: string) => {
    try {
      const applications = await jobApplicationsApi.getApplicationsByApplicant(applicantId);
      if (applications.length === 0) return "N/A";
      return applications.sort((a, b) => 
        new Date(b.application_date).getTime() - new Date(a.application_date).getTime()
      )[0].application_date;
    } catch (error) {
      console.error('Error fetching application dates:', error);
      return "N/A";
    }
  }



  // Add mutation for deleting applicant
  const deleteMutation = useMutation({
    mutationFn: (id: string) => applicantsApi.deleteApplicant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applicants"] })
      setShowDeleteDialog(false)
      toast.success("Applicant deleted")
    },
    onError: (error) => {
      toast.error("Failed to delete applicant. Please try again.")
    },
  })

  const handleDelete = () => {
    if (selectedApplicant) {
      deleteMutation.mutate(selectedApplicant.applicantId)
    }
  }

  // First, update the mutation to also update the selected applicant
  const updateMutation = useMutation({
    mutationFn: (data: { id: string; updates: any }) => 
      applicantsApi.updateApplicant(data.id, data.updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["applicants"] })
      // Update the selected applicant with the new data
      setSelectedApplicant(prev => prev ? { ...prev, ...variables.updates } : null)
      setShowEditDialog(false)
      toast.success("Applicant updated successfully")
    },
    onError: () => {
      toast.error("Failed to update applicant")
    },
  })

  // Add form handling for create
  const createForm = useForm<ApplicantFormValues>({
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

  // Add form handling for edit
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

  // Update the create handler
  const handleCreate = (values: ApplicantFormValues) => {
    createMutation.mutate(values)
  }

  // Update the edit handler
  const handleUpdate = (values: ApplicantFormValues) => {
    if (!selectedApplicant) return
    updateMutation.mutate({
      id: selectedApplicant.applicantId,
      updates: values,
    })
  }

  // Reset edit form when selected applicant changes
  useEffect(() => {
    if (selectedApplicant && showEditDialog) {
      editForm.reset({
        name: selectedApplicant.name || '',
        email: selectedApplicant.email || '',
        phoneNumber: selectedApplicant.phoneNumber || '',
        address: selectedApplicant.address || '',
        dateOfBirth: formatDateForInput(selectedApplicant.dateOfBirth) || '',
        applicantType: selectedApplicant.applicantType || ApplicantType.NORMAL,
        origin: selectedApplicant.origin || ApplicantOrigin.OTHER,
        hasEKG: selectedApplicant.hasEKG || false,
      })
    }
  }, [selectedApplicant, showEditDialog])

  // Add the create mutation
  const createMutation = useMutation({
    mutationFn: (newApplicant: any) => applicantsApi.createApplicant(newApplicant),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applicants"] })
      setShowAddDialog(false)
      toast.success("Jelentkező sikeresen hozzáadva")
    },
    onError: () => {
      toast.error("Hiba történt a jelentkező hozzáadása során")
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Jelentkezők</h2>
          <p className="text-muted-foreground">Jelentkezők kezelése</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Jelentkező hozzáadása
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Jelentkező keresése..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={jobId} onValueChange={setJobId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Munka szerint" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Minden munka</SelectItem>
            {jobsData?.jobs.map((job) => (
              <SelectItem key={job.jobId} value={job.jobId}>
                {job.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Jelentkező típusa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Minden típus</SelectItem>
            {Object.values(ApplicantType).map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={originFilter} onValueChange={setOriginFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Jelentkezés forrása" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Minden forrás</SelectItem>
            {Object.values(ApplicantOrigin).map((origin) => (
              <SelectItem key={origin} value={origin}>
                {origin}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => {
            setPageSize(Number(value));
            setCurrentPage(1); // Reset to first page when changing page size
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Oldalanként" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="12">12 oldalanként</SelectItem>
            <SelectItem value="24">24 oldalanként</SelectItem>
            <SelectItem value="48">48 oldalanként</SelectItem>
            <SelectItem value="96">96 oldalanként</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredApplicants.map((applicant) => (
          <Card
            key={applicant.applicantId}
            className="overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
            onClick={() => viewApplicant(applicant)}
          >
            <CardHeader className="pb-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${applicant.name.charAt(0)}`} />
                    <AvatarFallback>{applicant.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{applicant.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{applicant.email}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex flex-wrap gap-1 mb-2">
                  {applicant.jobs?.map((job, index) => (
                    <Badge key={index} variant="outline" className="text-xs font-bold">
                      {job.title}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{applicant.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{applicant.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{applicant.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Jelentkezés: {
                    allJobApplications[applicant.applicantId]?.length > 0
                      ? new Date(allJobApplications[applicant.applicantId]
                          .sort((a, b) => new Date(b.application_date).getTime() - new Date(a.application_date).getTime())[0]
                          .application_date
                        ).toLocaleDateString('hu-HU')
                      : "N/A"
                  }</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex w-fit items-center gap-1 font-normal">
                    <span className={`h-2 w-2 rounded-full ${getTypeColor(applicant.applicantType)}`}></span>
                    {applicant.applicantType}
                  </Badge>
                  <Badge variant="outline" className="flex w-fit items-center gap-1 font-normal">
                    <span className={`h-2 w-2 rounded-full ${getOriginColor(applicant.origin)}`}></span>
                    {applicant.origin}
                  </Badge>
                  {applicant.hasEKG && (
                    <Badge variant="outline" className="flex w-fit items-center gap-1 font-normal">
                      <span className="h-2 w-2 rounded-full bg-green-600"></span>
                      EÜ Kiskönyv
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {filteredApplicants.length === 0 && (
        <Card className="p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">Nincs találat</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Próbáljon meg más keresési feltételeket vagy szűrőket használni.
          </p>
        </Card>
      )}



      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        {selectedApplicant && (
          <DialogContent className="sm:max-w-[800px]">
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
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
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
                        </FormControl>
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
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select origin" />
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
                        </FormControl>
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
                  <Button type="submit">
                    Mentés
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        )}
      </Dialog>

      {/* Add the delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Biztos vagy benne?</AlertDialogTitle>
            <AlertDialogDescription>
              Ez az művelet nem visszafordítható. Ez véglegesen törli a jelentkezőt
              és eltávolítja adatait a rendszerből.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mégsem</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Törlés
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Új jelentkező hozzáadása</DialogTitle>
            <DialogDescription>Add meg az új jelentkező adatait.</DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="grid gap-4 py-4">
              <FormField
                control={createForm.control}
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
                control={createForm.control}
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
                control={createForm.control}
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
                control={createForm.control}
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
                control={createForm.control}
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
                  control={createForm.control}
                  name="applicantType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jelentkező típusa</FormLabel>
                      <FormControl>
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forrás</FormLabel>
                      <FormControl>
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={createForm.control}
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
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Mégsem
                </Button>
                <Button type="submit">
                  Hozzáadás
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add pagination controls */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Előző
          </Button>
          <span className="text-sm">
            Oldal {currentPage} / {Math.ceil(totalApplicants / pageSize)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={currentPage >= Math.ceil(totalApplicants / pageSize)}
          >
            Következő
          </Button>
        </div>
      </div>
    </div>
  )
}

