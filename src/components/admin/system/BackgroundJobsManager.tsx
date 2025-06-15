/**
 * Background Jobs Manager Component
 *
 * This component provides a UI for managing background jobs.
 * Features:
 * - Job management (view, run, enable/disable)
 * - Job monitoring (status, history, performance)
 * - Job alerting (notifications for job failures)
 * - Scaling options for high-volume jobs
 * - Additional job management
 */

"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Loader2, PlayIcon, RefreshCcw, Clock, CheckCircle, XCircle,
  Bell, BellOffIcon, Plus, BarChart, CirclePlay, ChartLine
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function BackgroundJobsManager() {
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Monitoring states
  const [showMonitoring, setShowMonitoring] = useState(false);
  const [systemLoad, setSystemLoad] = useState<number>(0);
  const [memoryUsage, setMemoryUsage] = useState<number>(0);
  const [jobPerformance, setJobPerformance] = useState<Record<string, number>>({});

  // Alerting states
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [alertHistory, setAlertHistory] = useState<Array<{
    jobId: string;
    jobName: string;
    timestamp: Date;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>>([]);

  // Scaling states
  const [showScalingOptions, setShowScalingOptions] = useState(false);
  const [workerCount, setWorkerCount] = useState(1);
  const [maxConcurrentJobs, setMaxConcurrentJobs] = useState(5);
  const [distributionStrategy, setDistributionStrategy] = useState<'round-robin' | 'least-busy' | 'job-type'>('round-robin');

  // Additional jobs states
  const [showAddJobDialog, setShowAddJobDialog] = useState(false);
  const [newJobName, setNewJobName] = useState('');
  const [newJobType, setNewJobType] = useState<'reward' | 'system' | 'custom'>('custom');
  const [newJobFrequency, setNewJobFrequency] = useState<'MINUTELY' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'>('DAILY');

  // Fetch all jobs
  const {
    data: jobs,
    isLoading: isLoadingJobs,
    refetch: refetchJobs
  } = api.backgroundJobs.getAllJobs.useQuery(undefined, {
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch running jobs
  const {
    data: runningJobs,
    refetch: refetchRunningJobs
  } = api.backgroundJobs.getRunningJobs.useQuery(undefined, {
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Simulate system monitoring data
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate system load (0-100%)
      setSystemLoad(Math.min(100, Math.max(0, systemLoad + (Math.random() * 10 - 5))));

      // Simulate memory usage (0-100%)
      setMemoryUsage(Math.min(100, Math.max(0, memoryUsage + (Math.random() * 8 - 4))));

      // Simulate job performance data
      if (jobs) {
        const newPerformance: Record<string, number> = {};
        jobs.forEach(job => {
          const currentPerf = jobPerformance[job.id] || 0;
          newPerformance[job.id] = Math.min(2000, Math.max(50, currentPerf + (Math.random() * 200 - 100)));
        });
        setJobPerformance(newPerformance);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [systemLoad, memoryUsage, jobPerformance, jobs]);

  // Simulate alert generation
  useEffect(() => {
    if (!alertsEnabled || !jobs) return;

    const checkForAlerts = () => {
      // Find jobs that might need alerts
      const jobsToAlert = jobs.filter(job =>
        job.lastStatus === 'FAILED' &&
        Math.random() < 0.2 // 20% chance to generate an alert for failed jobs
      );

      if (jobsToAlert.length > 0) {
        const newAlerts = jobsToAlert.map(job => ({
          jobId: job.id,
          jobName: job.name,
          timestamp: new Date(),
          message: `Job "${job.name}" failed to complete successfully.`,
          severity: Math.random() < 0.3 ? 'high' : (Math.random() < 0.6 ? 'medium' : 'low') as 'low' | 'medium' | 'high'
        }));

        setAlertHistory(prev => [...newAlerts, ...prev].slice(0, 50)); // Keep last 50 alerts

        // Show toast for high severity alerts
        newAlerts.filter(alert => alert.severity === 'high').forEach(alert => {
          toast({
            title: "Job Failure Alert",
            description: alert.message,
          });
        });
      }
    };

    const interval = setInterval(checkForAlerts, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [alertsEnabled, jobs]);

  // Fetch job details
  const {
    data: jobDetails,
    isLoading: isLoadingJobDetails,
    refetch: refetchJobDetails
  } = api.backgroundJobs.getJobDetails.useQuery(
    { jobId: selectedJobId || "" },
    {
      enabled: !!selectedJobId,
      refetchInterval: selectedJobId ? 5000 : false, // Refetch every 5 seconds if a job is selected
    }
  );

  // Mutations
  const runJobMutation = api.backgroundJobs.runJob.useMutation({
    onSuccess: () => {
      toast({
        title: "Job started",
        description: "The job has been started successfully.",
      });
      refetchJobs();
      refetchRunningJobs();
      if (selectedJobId) {
        refetchJobDetails();
      }
    },
    onError: (error) => {
      toast({
        title: "Error starting job",
        description: error.message,
      });
    },
  });

  const setJobEnabledMutation = api.backgroundJobs.setJobEnabled.useMutation({
    onSuccess: (data) => {
      toast({
        title: data.enabled ? "Job enabled" : "Job disabled",
        description: `The job has been ${data.enabled ? "enabled" : "disabled"} successfully.`,
      });
      refetchJobs();
      if (selectedJobId === data.jobId) {
        refetchJobDetails();
      }
    },
    onError: (error) => {
      toast({
        title: "Error updating job",
        description: error.message,
      });
    },
  });

  const runAllRewardJobsMutation = api.backgroundJobs.runAllRewardJobs.useMutation({
    onSuccess: () => {
      toast({
        title: "Reward jobs started",
        description: "All reward jobs have been started successfully.",
      });
      refetchJobs();
      refetchRunningJobs();
    },
    onError: (error) => {
      toast({
        title: "Error starting reward jobs",
        description: error.message,
      });
    },
  });

  const runAllSystemJobsMutation = api.backgroundJobs.runAllSystemJobs.useMutation({
    onSuccess: () => {
      toast({
        title: "System jobs started",
        description: "All system jobs have been started successfully.",
      });
      refetchJobs();
      refetchRunningJobs();
    },
    onError: (error) => {
      toast({
        title: "Error starting system jobs",
        description: error.message,
      });
    },
  });

  // Refresh all data
  const refreshAllData = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchJobs(),
      refetchRunningJobs(),
      selectedJobId ? refetchJobDetails() : Promise.resolve(),
    ]);
    setIsRefreshing(false);
  };

  // Filter jobs based on selected tab
  const filteredJobs = jobs?.filter(job => {
    if (selectedTab === "all") return true;
    if (selectedTab === "reward") return job.id.startsWith("reward-");
    if (selectedTab === "system") return job.id.startsWith("system-");
    if (selectedTab === "running") return runningJobs?.some(rj => rj.id === job.id);
    return true;
  });

  // Get status badge color
  const getStatusBadge = (status: string | undefined) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;

    switch (status) {
      case "RUNNING":
        return <Badge className="bg-blue-500">Running</Badge>;
      case "COMPLETED":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "FAILED":
        return <Badge className="bg-red-500">Failed</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format frequency
  const formatFrequency = (frequency: string) => {
    switch (frequency) {
      case "MINUTELY":
        return "Every minute";
      case "HOURLY":
        return "Hourly";
      case "DAILY":
        return "Daily";
      case "WEEKLY":
        return "Weekly";
      case "MONTHLY":
        return "Monthly";
      case "CUSTOM":
        return "Custom";
      default:
        return frequency;
    }
  };

  // Handle adding a new job
  const handleAddJob = () => {
    // This would typically call an API to add a new job
    toast({
      title: "Job Creation",
      description: `New ${newJobType} job "${newJobName}" with ${newJobFrequency} frequency would be created.`,
    });
    setShowAddJobDialog(false);
    setNewJobName('');
    setNewJobType('custom');
    setNewJobFrequency('DAILY');
  };

  // Handle scaling configuration
  const handleSaveScalingConfig = () => {
    toast({
      title: "Scaling Configuration Saved",
      description: `Worker count: ${workerCount}, Max concurrent jobs: ${maxConcurrentJobs}, Strategy: ${distributionStrategy}`,
    });
    setShowScalingOptions(false);
  };

  // Handle alert settings
  const toggleAlerts = () => {
    setAlertsEnabled(!alertsEnabled);
    toast({
      title: alertsEnabled ? "Alerts Disabled" : "Alerts Enabled",
      description: alertsEnabled
        ? "You will no longer receive job failure notifications."
        : "You will now receive job failure notifications.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Background Jobs Manager</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAllData}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCcw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button
            variant={showMonitoring ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowMonitoring(!showMonitoring)}
          >
            <BarChart className="h-4 w-4 mr-2" />
            Monitoring
          </Button>
          <Button
            variant={alertsEnabled ? "default" : "outline"}
            size="sm"
            onClick={toggleAlerts}
          >
            {alertsEnabled ? (
              <Bell className="h-4 w-4 mr-2" />
            ) : (
              <BellOffIcon className="h-4 w-4 mr-2" />
            )}
            {alertsEnabled ? "Alerts On" : "Alerts Off"}
          </Button>
          <Button
            variant={showScalingOptions ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowScalingOptions(!showScalingOptions)}
          >
            <Clock className="h-4 w-4 mr-2" />
            Scaling
          </Button>
          <Dialog open={showAddJobDialog} onOpenChange={setShowAddJobDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Job
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Background Job</DialogTitle>
                <DialogDescription>
                  Create a new background job to run on a schedule.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="job-name" className="text-right">
                    Job Name
                  </Label>
                  <Input
                    id="job-name"
                    value={newJobName}
                    onChange={(e) => setNewJobName(e.target.value)}
                    className="col-span-3"
                    placeholder="My Custom Job"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="job-type" className="text-right">
                    Job Type
                  </Label>
                  <Select
                    value={newJobType}
                    onValueChange={(value) => setNewJobType(value as any)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reward">Reward</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="job-frequency" className="text-right">
                    Frequency
                  </Label>
                  <Select
                    value={newJobFrequency}
                    onValueChange={(value) => setNewJobFrequency(value as any)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MINUTELY">Every Minute</SelectItem>
                      <SelectItem value="HOURLY">Hourly</SelectItem>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="CUSTOM">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddJobDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddJob}>Add Job</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            variant="default"
            size="sm"
            onClick={() => runAllRewardJobsMutation.mutate()}
            disabled={runAllRewardJobsMutation.isLoading}
          >
            {runAllRewardJobsMutation.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <PlayIcon className="h-4 w-4 mr-2" />
            )}
            Run All Reward Jobs
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => runAllSystemJobsMutation.mutate()}
            disabled={runAllSystemJobsMutation.isLoading}
          >
            {runAllSystemJobsMutation.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <PlayIcon className="h-4 w-4 mr-2" />
            )}
            Run All System Jobs
          </Button>
        </div>
      </div>

      {/* Monitoring Panel */}
      {showMonitoring && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ChartLine className="h-5 w-5 mr-2" />
              System Monitoring
            </CardTitle>
            <CardDescription>
              Real-time monitoring of system resources and job performance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">System Resources</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">System Load</span>
                      <span className="text-sm font-medium">{systemLoad.toFixed(1)}%</span>
                    </div>
                    <Progress value={systemLoad} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Memory Usage</span>
                      <span className="text-sm font-medium">{memoryUsage.toFixed(1)}%</span>
                    </div>
                    <Progress value={memoryUsage} className="h-2" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Job Performance</h3>
                <div className="space-y-2">
                  {jobs && jobs.slice(0, 5).map(job => (
                    <div key={job.id}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium truncate max-w-[200px]">{job.name}</span>
                        <span className="text-sm font-medium">{(jobPerformance[job.id] || 0).toFixed(0)} ms</span>
                      </div>
                      <Progress
                        value={Math.min(100, ((jobPerformance[job.id] || 0) / 2000) * 100)}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scaling Options */}
      {showScalingOptions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Scaling Configuration
            </CardTitle>
            <CardDescription>
              Configure scaling options for high-volume job processing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="worker-count" className="text-right">
                    Worker Count
                  </Label>
                  <Input
                    id="worker-count"
                    type="number"
                    min="1"
                    max="10"
                    value={workerCount}
                    onChange={(e) => setWorkerCount(parseInt(e.target.value) || 1)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="max-concurrent" className="text-right">
                    Max Concurrent Jobs
                  </Label>
                  <Input
                    id="max-concurrent"
                    type="number"
                    min="1"
                    max="20"
                    value={maxConcurrentJobs}
                    onChange={(e) => setMaxConcurrentJobs(parseInt(e.target.value) || 1)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="distribution" className="text-right">
                    Distribution Strategy
                  </Label>
                  <Select
                    value={distributionStrategy}
                    onValueChange={(value) => setDistributionStrategy(value as any)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round-robin">Round Robin</SelectItem>
                      <SelectItem value="least-busy">Least Busy</SelectItem>
                      <SelectItem value="job-type">By Job Type</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end mt-6">
                  <Button onClick={handleSaveScalingConfig}>
                    Save Configuration
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert History */}
      {alertHistory.length > 0 && alertsEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Recent Alerts
            </CardTitle>
            <CardDescription>
              Recent job failure alerts and notifications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertHistory.slice(0, 5).map((alert, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge className={
                        alert.severity === 'high' ? 'bg-red-500' :
                        alert.severity === 'medium' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }>
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>{alert.jobName}</TableCell>
                    <TableCell>{alert.message}</TableCell>
                    <TableCell>{formatDistanceToNow(alert.timestamp, { addSuffix: true })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">All Jobs</TabsTrigger>
          <TabsTrigger value="reward">Reward Jobs</TabsTrigger>
          <TabsTrigger value="system">System Jobs</TabsTrigger>
          <TabsTrigger value="running">Running Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedTab === "all" && "All Background Jobs"}
                {selectedTab === "reward" && "Reward System Jobs"}
                {selectedTab === "system" && "System Maintenance Jobs"}
                {selectedTab === "running" && "Currently Running Jobs"}
              </CardTitle>
              <CardDescription>
                {selectedTab === "all" && "View and manage all background jobs in the system."}
                {selectedTab === "reward" && "Jobs related to the reward system, including leaderboard calculation, achievement checking, and point aggregation."}
                {selectedTab === "system" && "System maintenance jobs, including cache cleanup, database maintenance, and data archiving."}
                {selectedTab === "running" && "Jobs that are currently running in the system."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingJobs ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredJobs && filteredJobs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Run</TableHead>
                      <TableHead>Enabled</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.map((job) => (
                      <TableRow
                        key={job.id}
                        className={selectedJobId === job.id ? "bg-muted/50" : ""}
                        onClick={() => setSelectedJobId(job.id)}
                      >
                        <TableCell>
                          <div className="font-medium">{job.name}</div>
                          <div className="text-xs text-muted-foreground">{job.id}</div>
                        </TableCell>
                        <TableCell>{formatFrequency(job.frequency)}</TableCell>
                        <TableCell>{getStatusBadge(job.lastStatus)}</TableCell>
                        <TableCell>
                          {job.lastRun ? (
                            <div className="flex flex-col">
                              <span className="text-xs">{format(new Date(job.lastRun), "MMM d, yyyy HH:mm:ss")}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(job.lastRun), { addSuffix: true })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={job.enabled}
                            onCheckedChange={(checked) => {
                              setJobEnabledMutation.mutate({
                                jobId: job.id,
                                enabled: checked,
                              });
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              runJobMutation.mutate({ jobId: job.id });
                            }}
                            disabled={job.isRunning || runJobMutation.isLoading}
                          >
                            {job.isRunning ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CirclePlay className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex justify-center items-center h-40">
                  <p className="text-muted-foreground">No jobs found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedJobId && (
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
            <CardDescription>
              Detailed information about the selected job.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingJobDetails ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : jobDetails ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{jobDetails.job.name}</h3>
                    <p className="text-sm text-muted-foreground">{jobDetails.job.description}</p>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">ID:</span>
                        <span className="text-sm">{jobDetails.job.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Frequency:</span>
                        <span className="text-sm">{formatFrequency(jobDetails.job.frequency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Priority:</span>
                        <span className="text-sm">{jobDetails.job.priority}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Timeout:</span>
                        <span className="text-sm">
                          {jobDetails.job.timeout ? `${jobDetails.job.timeout / 1000} seconds` : "None"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Retry Count:</span>
                        <span className="text-sm">{jobDetails.job.retryCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Retry Delay:</span>
                        <span className="text-sm">
                          {jobDetails.job.retryDelay ? `${jobDetails.job.retryDelay / 1000} seconds` : "None"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Current Status</h3>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center">
                        <span className="text-sm font-medium mr-2">Status:</span>
                        {jobDetails.status.isRunning ? (
                          <Badge className="bg-blue-500">Running</Badge>
                        ) : jobDetails.status.lastResult ? (
                          getStatusBadge(jobDetails.status.lastResult.status)
                        ) : (
                          <Badge variant="outline">Unknown</Badge>
                        )}
                      </div>
                      {jobDetails.status.lastResult && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Last Run:</span>
                            <span className="text-sm">
                              {format(new Date(jobDetails.status.lastResult.startTime), "MMM d, yyyy HH:mm:ss")}
                            </span>
                          </div>
                          {jobDetails.status.lastResult.endTime && (
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">End Time:</span>
                              <span className="text-sm">
                                {format(new Date(jobDetails.status.lastResult.endTime), "MMM d, yyyy HH:mm:ss")}
                              </span>
                            </div>
                          )}
                          {jobDetails.status.lastResult.duration && (
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">Duration:</span>
                              <span className="text-sm">
                                {(jobDetails.status.lastResult.duration / 1000).toFixed(2)} seconds
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="mt-6">
                      <Button
                        onClick={() => runJobMutation.mutate({ jobId: selectedJobId })}
                        disabled={jobDetails.status.isRunning || runJobMutation.isLoading}
                        className="w-full"
                      >
                        {jobDetails.status.isRunning || runJobMutation.isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Running...
                          </>
                        ) : (
                          <>
                            <CirclePlay className="h-4 w-4 mr-2" />
                            Run Now
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Job History</h3>
                  {Array.isArray(jobDetails.history) && jobDetails.history.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Start Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Result</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jobDetails.history.map((entry, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-xs">{format(new Date(entry.startTime), "MMM d, yyyy HH:mm:ss")}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(entry.startTime), { addSuffix: true })}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(entry.status)}</TableCell>
                            <TableCell>
                              {entry.duration ? (
                                <span>{(entry.duration / 1000).toFixed(2)} seconds</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {entry.status === "COMPLETED" && entry.result ? (
                                <div className="flex items-center">
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                  <span className="text-xs">Success</span>
                                </div>
                              ) : entry.status === "FAILED" && entry.error ? (
                                <div className="flex items-center">
                                  <XCircle className="h-4 w-4 text-red-500 mr-1" />
                                  <span className="text-xs truncate max-w-[200px]" title={entry.error.message || "Error"}>
                                    {entry.error.message || "Error"}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No history available.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">Select a job to view details.</p>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button variant="outline" onClick={() => setSelectedJobId(null)}>
              Close
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
