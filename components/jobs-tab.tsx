"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Briefcase, Plus, Edit, Trash2, Clock, Users, MapPin, CircleDollarSign, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Job, JobType, CreateJobInput, UpdateJobInput } from "@/types/job"
import { jobsApi } from "@/lib/api/jobs"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"


// Add the job schema
const jobFormSchema = z.object({
  title: z.string().min(3, "A munka megnevezése legalább 3 karakter hosszú kell legyen"),
  description: z.string().min(10, "A munka leírása legalább 10 karakter hosszú kell legyen"),
  jobPlace: z.string().min(2, "A munka helyszínének megadása szükséges"),
  type: z.enum([JobType.NORMAL, JobType.STUDENT, JobType.ELDER]),
  salary: z.string().regex(/^\d+$/, "A fizetés szám kell, hogy legyen"),
})

type JobFormValues = z.infer<typeof jobFormSchema>

export function JobsTab() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalJobs, setTotalJobs] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newJob, setNewJob] = useState({
    title: "",
    description: "",
    jobPlace: "",
    type: JobType.NORMAL,
    salary: "",
  });
  const [editingJob, setEditingJob] = useState<null | string>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Reset page to 1 when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter]);

  const { data: paginatedData, isLoading, error } = useQuery({
    queryKey: ["jobs", currentPage, pageSize, searchTerm, typeFilter, statusFilter],
    queryFn: () => jobsApi.getJobsPaginated(
      currentPage,
      pageSize,
      searchTerm,
      typeFilter,
      statusFilter
    ),
  });

  // Extract jobs from paginated data
  const jobs = paginatedData?.jobs ?? [];
  const total = paginatedData?.total ?? 0;

  // Update total when data changes
  useEffect(() => {
    if (total !== totalJobs) {
      setTotalJobs(total);
    }
  }, [total]);

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      description: "",
      jobPlace: "",
      type: JobType.NORMAL,
      salary: "",
    },
  })

  const createJobMutation = useMutation({
    mutationFn: jobsApi.createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setShowAddDialog(false);
      toast.success("Job created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create job");
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ jobId, updates }: { jobId: string; updates: UpdateJobInput }) =>
      jobsApi.updateJob(jobId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setShowEditDialog(false);
      toast.success("Job updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update job");
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: jobsApi.deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete job");
    },
  });

  // Update the handlers to use form data
  const handleAddJob = (data: JobFormValues) => {
    createJobMutation.mutate({
      title: data.title,
      description: data.description,
      jobPlace: data.jobPlace,
      jobType: data.type,
      salary: data.salary,
    });
    form.reset();
  };

  // Update the Dialog content for adding jobs
  const addJobDialog = (
    <DialogContent className="sm:max-w-[550px]">
      <DialogHeader>
        <DialogTitle>Új munka létrehozása</DialogTitle>
        <DialogDescription>Új munka létrehozása az alkalmazásban.</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleAddJob)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Munka megnevezése</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="pl. Programozó" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Munka leírása</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Írd le a munka követelményeit"
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="salary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Órabér (Ft)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="pl. 2500" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="jobPlace"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Helyszín</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="pl. Budapest" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Munka típusa</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Válassz munka típust" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={JobType.NORMAL}>{JobType.NORMAL}</SelectItem>
                      <SelectItem value={JobType.STUDENT}>{JobType.STUDENT}</SelectItem>
                      <SelectItem value={JobType.ELDER}>{JobType.ELDER}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setShowAddDialog(false)}>
              Mégse
            </Button>
            <Button type="submit">Létrehozás</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );

  // Similarly update the edit dialog form
  const editForm = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: newJob.title,
      description: newJob.description,
      jobPlace: newJob.jobPlace,
      type: newJob.type,
      salary: newJob.salary,
    },
  });

  const handleEditJob = (data: JobFormValues) => {
    if (editingJob) {
      updateJobMutation.mutate({
        jobId: editingJob,
        updates: {
          title: data.title,
          description: data.description,
          jobPlace: data.jobPlace,
          jobType: data.type,
          salary: data.salary,
        },
      });
    }
    editForm.reset();
  };

  // Update the startEdit function
  const startEdit = (job: Job) => {
    setEditingJob(job.jobId);
    editForm.reset({
      title: job.title,
      description: job.description,
      jobPlace: job.jobPlace,
      type: job.jobType,
      salary: job.salary || "",
    });
    setShowEditDialog(true);
  };

  const toggleJobStatus = (jobId: string) => {
    const job = jobs.find((j) => j.jobId === jobId);
    if (job) {
      updateJobMutation.mutate({
        jobId,
        updates: { isActive: !job.isActive },
      });
    }
  }

  const deleteJob = (jobId: string) => {
    deleteJobMutation.mutate(jobId);
  }

  // Move the rendering logic into a separate function
  const renderContent = () => {
    if (isLoading) {
      return <div>Loading jobs...</div>;
    }

    if (error) {
      return <div>Error loading jobs: {(error as Error).message}</div>;
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Munkák</h2>
            <p className="text-muted-foreground">Munkák létrehozása és kezelése</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Munka hozzáadása
                </Button>
              </DialogTrigger>
              {addJobDialog}
            </Dialog>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Munka keresése..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => {
                e.preventDefault();
                setSearchTerm(e.target.value);
              }}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Munka típusa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Minden típus</SelectItem>
              <SelectItem value={JobType.NORMAL}>{JobType.NORMAL}</SelectItem>
              <SelectItem value={JobType.STUDENT}>{JobType.STUDENT}</SelectItem>
              <SelectItem value={JobType.ELDER}>{JobType.ELDER}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Státusz" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Minden státusz</SelectItem>
              <SelectItem value="active">Aktív</SelectItem>
              <SelectItem value="inactive">Inaktív</SelectItem>
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job: Job) => (
            <Card key={job.jobId} className={`${job.isActive ? "" : "opacity-70"} hover:shadow-md transition-shadow flex flex-col`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      <Badge variant={job.isActive ? "default" : "outline"} className="ml-2">
                        {job.isActive ? "Aktív" : "Inaktív"}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center text-sm">
                      <MapPin className="mr-1.5 h-4 w-4 text-muted-foreground/70" />
                      {job.jobPlace}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3em]">{job.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  <Badge 
                    variant="secondary" 
                    className={`
                      px-3 py-1 rounded-full
                      ${job.jobType === JobType.NORMAL ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : ''}
                      ${job.jobType === JobType.STUDENT ? 'bg-green-50 text-green-700 hover:bg-green-100' : ''}
                      ${job.jobType === JobType.ELDER ? 'bg-purple-50 text-purple-700 hover:bg-purple-100' : ''}
                    `}
                  >
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {job.jobType}
                    </div>
                  </Badge>
                  
                  {job.salary && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 px-3 py-1 rounded-full">
                      <div className="flex items-center gap-1">
                        <CircleDollarSign className="h-3 w-3" />
                        {job.salary} Ft/óra
                      </div>
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Létrehozva: {new Date(job.createdAt).toLocaleDateString('en-CA')}</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={job.isActive}
                    onCheckedChange={() => toggleJobStatus(job.jobId)}
                    id={`job-status-${job.jobId}`}
                  />
                  <Label htmlFor={`job-status-${job.jobId}`} className="text-sm">
                    {job.isActive ? "Aktív" : "Inaktív"}
                  </Label>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => startEdit(job)}
                    className="hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => deleteJob(job.jobId)}
                    className="hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-60 border rounded-lg bg-muted/20">
            <Briefcase className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No jobs found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm
                ? "No jobs found for the given search term."
                : typeFilter !== "all"
                  ? `You don't have any ${typeFilter.toLowerCase()} jobs.`
                  : "You haven't created any jobs yet."}
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Munka hozzáadása
            </Button>
          </div>
        )}

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
              Oldal {currentPage} / {Math.ceil(totalJobs / pageSize)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage >= Math.ceil(totalJobs / pageSize)}
            >
              Következő
            </Button>
          </div>
        </div>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Munka szerkesztése</DialogTitle>
              <DialogDescription>Munka adatainak frissítése.</DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditJob)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Munka megnevezése</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="pl. Programozó" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Munka leírása</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Rövid leírás a munka céljáról és követelményeiről"
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Órabér (Ft)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="pl. 2500" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="jobPlace"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Helyszín</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="pl. Budapest, Pécs, Debrecen" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Munka típusa</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Válassz munka típust" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={JobType.NORMAL}>{JobType.NORMAL}</SelectItem>
                            <SelectItem value={JobType.STUDENT}>{JobType.STUDENT}</SelectItem>
                            <SelectItem value={JobType.ELDER}>{JobType.ELDER}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setShowEditDialog(false)}>
                    Mégse
                  </Button>
                  <Button type="submit">Mentés</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // Return the content
  return renderContent();
}

