'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui';
import { AlertCircle, ArrowLeft, BarChart3, Download, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Define the H5P content type
interface H5PContentItem {
  id: string;
  contentId: string;
  title: string;
  library: string;
  createdAt: string;
  updatedAt: string;
  status: string;
}

// Define the H5P completion type
interface H5PCompletionItem {
  id: string;
  userId: string;
  contentId: string;
  score: number | null;
  maxScore: number | null;
  completed: boolean;
  progress: number | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    username: string;
  };
}

// Define the user type
interface User {
  id: string;
  name: string;
  email: string;
  username: string;
}

export default function H5PAnalyticsPage() {
  const router = useRouter();
  const [contents, setContents] = useState<H5PContentItem[]>([]);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [completions, setCompletions] = useState<H5PCompletionItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch H5P content
  const fetchContents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/h5p/content');
      if (!response.ok) {
        throw new Error('Failed to fetch H5P content');
      }

      const data = await response.json();
      setContents(data);

      // Select the first content by default
      if (data.length > 0 && !selectedContent) {
        setSelectedContent(data[0].contentId);
      }
    } catch (error) {
      console.error('Error fetching H5P content:', error);
      setError('Failed to fetch H5P content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch completions for a specific content
  const fetchCompletions = async (contentId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/h5p/analytics/content/${contentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch completions');
      }

      const data = await response.json();
      setCompletions(data);
    } catch (error) {
      console.error('Error fetching completions:', error);
      setError('Failed to fetch completions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load content on mount
  useEffect(() => {
    fetchContents();
    fetchUsers();
  }, []);

  // Fetch completions when selected content changes
  useEffect(() => {
    if (selectedContent) {
      fetchCompletions(selectedContent);
    }
  }, [selectedContent]);

  // Filter completions based on search term and selected user
  const filteredCompletions = completions.filter(completion => {
    const matchesSearch = completion.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         completion.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         completion.user.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedUser) {
      return matchesSearch && completion.userId === selectedUser;
    }

    return matchesSearch;
  });

  // Calculate completion statistics
  const completionStats = {
    total: completions.length,
    completed: completions.filter(c => c.completed).length,
    inProgress: completions.filter(c => !c.completed && (c.progress || 0) > 0).length,
    notStarted: completions.filter(c => !c.completed && !c.progress).length,
    averageScore: completions.length > 0
      ? Math.round(completions.reduce((sum, c) => sum + (c.score || 0), 0) / completions.length)
      : 0,
    completionRate: completions.length > 0
      ? Math.round((completions.filter(c => c.completed).length / completions.length) * 100)
      : 0,
  };

  // Get selected content details
  const getSelectedContentDetails = () => {
    if (!selectedContent) return null;
    return contents.find(content => content.contentId === selectedContent);
  };

  // Export data as CSV
  const exportCSV = () => {
    if (!completions.length) return;

    const headers = ['User', 'Username', 'Email', 'Completed', 'Score', 'Max Score', 'Progress', 'Last Updated'];
    const rows = completions.map(c => [
      c.user.name,
      c.user.username,
      c.user.email,
      c.completed ? 'Yes' : 'No',
      c.score || 0,
      c.maxScore || 0,
      c.progress || 0,
      new Date(c.updatedAt).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `h5p-analytics-${selectedContent}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get library name from full library string
  const getLibraryName = (library: string) => {
    const match = library.match(/^([^.]+\.[^.]+)/);
    return match ? match[1].replace('.', ' ') : library;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/h5p-manager')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">H5P Analytics</h1>
            <p className="text-muted-foreground">Track user progress with H5P activities</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportCSV}
            disabled={!completions.length}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>H5P Content</CardTitle>
              <CardDescription>Select content to view analytics</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && contents.length === 0 ? (
                <div className="flex justify-center items-center h-32">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : contents.length === 0 ? (
                <p className="text-muted-foreground text-center">No H5P content found</p>
              ) : (
                <Select
                  value={selectedContent || ''}
                  onValueChange={setSelectedContent}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select content" />
                  </SelectTrigger>
                  <SelectContent>
                    {contents.map((content) => (
                      <SelectItem key={content.contentId} value={content.contentId}>
                        {content.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {selectedContent && getSelectedContentDetails() && (
                <div className="mt-4">
                  <h3 className="font-medium">{getSelectedContentDetails()?.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {getLibraryName(getSelectedContentDetails()?.library || '')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created: {new Date(getSelectedContentDetails()?.createdAt || '').toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Filter by User</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedUser || ''}
                onValueChange={setSelectedUser}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="mt-4">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          {!selectedContent ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <p className="text-muted-foreground mb-4">Select H5P content to view analytics</p>
              </CardContent>
            </Card>
          ) : loading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <Spinner className="h-8 w-8 mb-4" />
                <p className="text-muted-foreground">Loading analytics...</p>
              </CardContent>
            </Card>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="users">User Details</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold">{completionStats.completionRate}%</div>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Progress value={completionStats.completionRate} className="mt-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        {completionStats.completed} of {completionStats.total} users completed
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold">{completionStats.averageScore}%</div>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Progress value={completionStats.averageScore} className="mt-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        Based on {completions.filter(c => c.score !== null).length} submissions
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Progress Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                          <div className="text-sm">Completed: {completionStats.completed}</div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                          <div className="text-sm">In Progress: {completionStats.inProgress}</div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
                          <div className="text-sm">Not Started: {completionStats.notStarted}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>User Progress</CardTitle>
                    <CardDescription>
                      Progress of all users for this H5P content
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {filteredCompletions.length === 0 ? (
                      <p className="text-center py-4 text-muted-foreground">
                        No user data available for this content
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {filteredCompletions.map((completion) => (
                          <div key={completion.id} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium">{completion.user.name}</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  ({completion.user.username})
                                </span>
                              </div>
                              <div className="text-sm">
                                {completion.completed ? (
                                  <span className="text-green-600">Completed</span>
                                ) : (completion.progress || 0) > 0 ? (
                                  <span className="text-yellow-600">In Progress</span>
                                ) : (
                                  <span className="text-gray-500">Not Started</span>
                                )}
                              </div>
                            </div>
                            <Progress value={completion.progress || 0} />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>
                                Score: {completion.score !== null ? `${completion.score}/${completion.maxScore}` : 'N/A'}
                              </span>
                              <span>
                                Last updated: {new Date(completion.updatedAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users">
                <Card>
                  <CardHeader>
                    <CardTitle>User Details</CardTitle>
                    <CardDescription>
                      Detailed information about user interactions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {filteredCompletions.length === 0 ? (
                      <p className="text-center py-4 text-muted-foreground">
                        No user data available for this content
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Score</TableHead>
                              <TableHead>Progress</TableHead>
                              <TableHead>First Attempt</TableHead>
                              <TableHead>Last Updated</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCompletions.map((completion) => (
                              <TableRow key={completion.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{completion.user.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {completion.user.email}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {completion.completed ? (
                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                      Completed
                                    </span>
                                  ) : (completion.progress || 0) > 0 ? (
                                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                                      In Progress
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                      Not Started
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {completion.score !== null ? (
                                    <div>
                                      <span className="font-medium">{completion.score}</span>
                                      <span className="text-muted-foreground">/{completion.maxScore}</span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">N/A</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="w-24">
                                    <Progress value={completion.progress || 0} />
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {completion.progress || 0}%
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {new Date(completion.createdAt).toLocaleDateString()}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(completion.createdAt).toLocaleTimeString()}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {new Date(completion.updatedAt).toLocaleDateString()}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(completion.updatedAt).toLocaleTimeString()}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
