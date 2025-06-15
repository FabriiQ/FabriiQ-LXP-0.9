'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, BarChart3, Edit, Eye, FileUp, Plus, Trash2, Download } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui';

// Define the H5P content type
interface H5PContentItem {
  id: string;
  contentId: string;
  title: string;
  library: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  slug?: string;
}

export default function H5PManagerPage() {
  const router = useRouter();
  const [contents, setContents] = useState<H5PContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

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
    } catch (error) {
      console.error('Error fetching H5P content:', error);
      setError('Failed to fetch H5P content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load content on mount
  useEffect(() => {
    fetchContents();
  }, []);

  // Filter content based on search term and active tab
  const filteredContents = contents.filter(content => {
    const matchesSearch = content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.library.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'all') {
      return matchesSearch;
    }

    return matchesSearch && content.status === activeTab.toUpperCase();
  });

  // Handle content creation
  const handleCreateContent = () => {
    setIsCreateDialogOpen(false);
    router.push('/h5p-editor/new');
  };

  // Handle content import
  const handleImportContent = async () => {
    if (!importFile) {
      setImportError('Please select a file to import');
      return;
    }

    try {
      setImportLoading(true);
      setImportError(null);

      const formData = new FormData();
      formData.append('h5p', importFile);

      const response = await fetch('/api/h5p/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import H5P content');
      }

      await fetchContents();
      setIsImportDialogOpen(false);
      setImportFile(null);
    } catch (error) {
      console.error('Error importing H5P content:', error);
      setImportError(error instanceof Error ? error.message : 'Failed to import H5P content');
    } finally {
      setImportLoading(false);
    }
  };

  // Handle content deletion
  const handleDeleteContent = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/h5p/content/${contentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete H5P content');
      }

      await fetchContents();
    } catch (error) {
      console.error('Error deleting H5P content:', error);
      setError('Failed to delete H5P content. Please try again.');
    }
  };

  // Handle content export
  const handleExportContent = async (contentId: string) => {
    try {
      window.open(`/api/h5p/export/${contentId}`, '_blank');
    } catch (error) {
      console.error('Error exporting H5P content:', error);
      setError('Failed to export H5P content. Please try again.');
    }
  };

  // Get library name from full library string
  const getLibraryName = (library: string) => {
    const match = library.match(/^([^.]+\.[^.]+)/);
    return match ? match[1].replace('.', ' ') : library;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">H5P Content Manager</h1>
          <p className="text-muted-foreground">Manage your interactive H5P content</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/h5p-analytics')} variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <Button onClick={() => setIsImportDialogOpen(true)} variant="outline">
            <FileUp className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create New
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

      <div className="mb-6">
        <Input
          placeholder="Search by title or content type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner className="h-8 w-8" />
          <span className="ml-2">Loading content...</span>
        </div>
      ) : filteredContents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground mb-4">No H5P content found</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create New Content
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContents.map((content) => (
            <Card key={content.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="truncate">{content.title}</CardTitle>
                    <CardDescription>
                      {getLibraryName(content.library)}
                    </CardDescription>
                  </div>
                  <Badge variant={content.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {content.status.toLowerCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <p>Created: {new Date(content.createdAt).toLocaleDateString()}</p>
                  <p>Updated: {new Date(content.updatedAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/h5p-player/${content.contentId}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/h5p-editor/${content.contentId}`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportContent(content.contentId)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteContent(content.contentId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create Content Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New H5P Content</DialogTitle>
            <DialogDescription>
              Create a new interactive H5P content item.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>You will be redirected to the H5P editor to create your content.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateContent}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Content Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import H5P Content</DialogTitle>
            <DialogDescription>
              Upload an H5P file to import content.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="h5p-file">H5P File</Label>
            <Input
              id="h5p-file"
              type="file"
              accept=".h5p"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="mt-2"
            />
            {importError && (
              <p className="text-sm text-red-500 mt-2">{importError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportContent} disabled={importLoading || !importFile}>
              {importLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Importing...
                </>
              ) : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
