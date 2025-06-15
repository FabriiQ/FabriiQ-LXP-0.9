'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  Filter,
  Plus,
  Award,
  Calendar,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import { Trophy, Medal, Star } from "@/components/ui/icons/reward-icons";
// Use a different icon since Gift is not available
import { Award as Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TeacherAchievement {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherAvatar?: string;
  achievementId: string;
  achievementName: string;
  achievementDescription: string;
  achievementIcon: string;
  points: number;
  awardedAt: Date;
  awardedBy: string;
  isPublic: boolean;
  notes?: string;
}

interface AchievementType {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  category: string;
}

interface TeacherAchievementRecognitionProps {
  campusId?: string;
  programId?: string;
  isLoading?: boolean;
  achievements?: TeacherAchievement[];
  achievementTypes?: AchievementType[];
  teachers?: Array<{
    id: string;
    name: string;
    avatar?: string;
    department?: string;
  }>;
  onAchievementCreate?: (achievement: Omit<TeacherAchievement, 'id'>) => Promise<void>;
  onAchievementUpdate?: (id: string, achievement: Partial<TeacherAchievement>) => Promise<void>;
  onAchievementDelete?: (id: string) => Promise<void>;
  onSearch?: (query: string) => void;
  onFilter?: (filters: any) => void;
}

export function TeacherAchievementRecognition({
  campusId,
  programId,
  isLoading = false,
  achievements = [],
  achievementTypes = [],
  teachers = [],
  onAchievementCreate,
  onAchievementUpdate,
  onAchievementDelete,
  onSearch,
  onFilter
}: TeacherAchievementRecognitionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('achievements');

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<TeacherAchievement | null>(null);

  const [newAchievement, setNewAchievement] = useState({
    teacherId: '',
    teacherName: '',
    achievementId: '',
    achievementName: '',
    achievementDescription: '',
    achievementIcon: '',
    points: 0,
    awardedAt: new Date(),
    awardedBy: '',
    isPublic: true,
    notes: ''
  });

  const { toast } = useToast();

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  // Handle filter change
  const handleFilterChange = () => {
    if (onFilter) {
      onFilter({
        category: categoryFilter !== 'all' ? categoryFilter : undefined
      });
    }
  };

  // Handle create achievement
  const handleCreateAchievement = async () => {
    if (!newAchievement.teacherId || !newAchievement.achievementId) {
      toast({
        title: "Validation Error",
        description: "Please select a teacher and an achievement type.",
        variant: "error",
      });
      return;
    }

    try {
      if (onAchievementCreate) {
        await onAchievementCreate(newAchievement);
        toast({
          title: "Achievement Created",
          description: "Teacher achievement has been awarded successfully.",
        });
        setIsCreateDialogOpen(false);
        setNewAchievement({
          teacherId: '',
          teacherName: '',
          achievementId: '',
          achievementName: '',
          achievementDescription: '',
          achievementIcon: '',
          points: 0,
          awardedAt: new Date(),
          awardedBy: '',
          isPublic: true,
          notes: ''
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to award achievement.",
        variant: "error",
      });
    }
  };

  // Handle update achievement
  const handleUpdateAchievement = async () => {
    if (!selectedAchievement) return;

    try {
      if (onAchievementUpdate) {
        await onAchievementUpdate(selectedAchievement.id, selectedAchievement);
        toast({
          title: "Achievement Updated",
          description: "Teacher achievement has been updated successfully.",
        });
        setIsEditDialogOpen(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update achievement.",
        variant: "error",
      });
    }
  };

  // Handle delete achievement
  const handleDeleteAchievement = async () => {
    if (!selectedAchievement) return;

    try {
      if (onAchievementDelete) {
        await onAchievementDelete(selectedAchievement.id);
        toast({
          title: "Achievement Deleted",
          description: "Teacher achievement has been deleted successfully.",
        });
        setIsDeleteDialogOpen(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete achievement.",
        variant: "error",
      });
    }
  };

  // Handle achievement type selection
  const handleAchievementTypeChange = (achievementId: string) => {
    const selectedType = achievementTypes.find(type => type.id === achievementId);
    if (selectedType) {
      setNewAchievement({
        ...newAchievement,
        achievementId: selectedType.id,
        achievementName: selectedType.name,
        achievementDescription: selectedType.description,
        achievementIcon: selectedType.icon,
        points: selectedType.points
      });
    }
  };

  // Handle teacher selection
  const handleTeacherChange = (teacherId: string) => {
    const selectedTeacher = teachers.find(teacher => teacher.id === teacherId);
    if (selectedTeacher) {
      setNewAchievement({
        ...newAchievement,
        teacherId: selectedTeacher.id,
        teacherName: selectedTeacher.name
      });
    }
  };

  // Get icon component for achievement
  const getAchievementIcon = (icon: string) => {
    switch (icon) {
      case 'award':
        return <Award className="h-5 w-5" />;
      case 'trophy':
        return <Trophy className="h-5 w-5" />;
      case 'star':
        return <Star className="h-5 w-5" />;
      case 'medal':
        return <Medal className="h-5 w-5" />;
      case 'gift':
        return <Gift className="h-5 w-5" />;
      default:
        return <Award className="h-5 w-5" />;
    }
  };

  // Get unique categories from achievement types
  const getUniqueCategories = () => {
    const categories = achievementTypes.map(type => type.category);
    return [...new Set(categories)];
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Teacher Achievement Recognition</h2>

        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Award Achievement
        </Button>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search achievements or teachers..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" type="submit">
            Search
          </Button>
        </form>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="category-filter">Category</Label>
              <Select
                value={categoryFilter}
                onValueChange={(value) => {
                  setCategoryFilter(value);
                  handleFilterChange();
                }}
              >
                <SelectTrigger id="category-filter">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {getUniqueCategories().map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setCategoryFilter('all');
                  handleFilterChange();
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="achievements">Awarded Achievements</TabsTrigger>
          <TabsTrigger value="types">Achievement Types</TabsTrigger>
        </TabsList>

        {/* Awarded Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Achievements</CardTitle>
              <CardDescription>
                Achievements awarded to teachers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Achievement</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Awarded Date</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {achievements.length > 0 ? (
                    achievements.map((achievement) => (
                      <TableRow key={achievement.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={achievement.teacherAvatar} alt={achievement.teacherName} />
                              <AvatarFallback>
                                {achievement.teacherName.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{achievement.teacherName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="bg-primary/10 p-1.5 rounded-full text-primary">
                              {getAchievementIcon(achievement.achievementIcon)}
                            </div>
                            <div>
                              <p className="font-medium">{achievement.achievementName}</p>
                              <p className="text-xs text-muted-foreground">{achievement.achievementDescription}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {achievement.points} pts
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(achievement.awardedAt), "PP")}</TableCell>
                        <TableCell>
                          {achievement.isPublic ? (
                            <Badge variant="success" className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Public
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              Private
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedAchievement(achievement);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedAchievement(achievement);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedAchievement(achievement);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        No achievements awarded yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievement Types Tab */}
        <TabsContent value="types" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Achievement Types</CardTitle>
              <CardDescription>
                Types of achievements that can be awarded to teachers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievementTypes.map((type) => (
                  <Card key={type.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-full text-primary">
                            {getAchievementIcon(type.icon)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{type.name}</CardTitle>
                            <CardDescription>{type.category}</CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline">{type.points} pts</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{type.description}</p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          handleAchievementTypeChange(type.id);
                          setIsCreateDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Award to Teacher
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Achievement Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Award Achievement</DialogTitle>
            <DialogDescription>
              Recognize a teacher's accomplishments by awarding an achievement.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacher-select" className="text-right">
                Teacher
              </Label>
              <Select
                value={newAchievement.teacherId}
                onValueChange={handleTeacherChange}
              >
                <SelectTrigger id="teacher-select" className="col-span-3">
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name} {teacher.department ? `(${teacher.department})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="achievement-select" className="text-right">
                Achievement
              </Label>
              <Select
                value={newAchievement.achievementId}
                onValueChange={handleAchievementTypeChange}
              >
                <SelectTrigger id="achievement-select" className="col-span-3">
                  <SelectValue placeholder="Select achievement" />
                </SelectTrigger>
                <SelectContent>
                  {achievementTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} ({type.points} pts)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="awarded-date" className="text-right">
                Award Date
              </Label>
              <Input
                id="awarded-date"
                type="date"
                value={newAchievement.awardedAt.toISOString().split('T')[0]}
                onChange={(e) => setNewAchievement({
                  ...newAchievement,
                  awardedAt: new Date(e.target.value)
                })}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="visibility" className="text-right">
                Visibility
              </Label>
              <Select
                value={newAchievement.isPublic ? 'public' : 'private'}
                onValueChange={(value) => setNewAchievement({
                  ...newAchievement,
                  isPublic: value === 'public'
                })}
              >
                <SelectTrigger id="visibility" className="col-span-3">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public (visible to everyone)</SelectItem>
                  <SelectItem value="private">Private (visible to coordinators only)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={newAchievement.notes}
                onChange={(e) => setNewAchievement({...newAchievement, notes: e.target.value})}
                className="col-span-3"
                placeholder="Additional notes about this achievement"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAchievement}>Award Achievement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Achievement Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Achievement Details</DialogTitle>
          </DialogHeader>

          {selectedAchievement && (
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="bg-primary/10 p-4 rounded-full text-primary">
                  {getAchievementIcon(selectedAchievement.achievementIcon)}
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold">{selectedAchievement.achievementName}</h3>
                  <p className="text-muted-foreground">{selectedAchievement.achievementDescription}</p>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {selectedAchievement.points} points
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Awarded To</h4>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedAchievement.teacherAvatar} alt={selectedAchievement.teacherName} />
                      <AvatarFallback>
                        {selectedAchievement.teacherName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{selectedAchievement.teacherName}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-1">Awarded By</h4>
                  <p>{selectedAchievement.awardedBy}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-1">Award Date</h4>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(selectedAchievement.awardedAt), "PPP")}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-1">Visibility</h4>
                  {selectedAchievement.isPublic ? (
                    <Badge variant="success" className="flex items-center gap-1 w-fit">
                      <CheckCircle className="h-3 w-3" />
                      Public
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                      <XCircle className="h-3 w-3" />
                      Private
                    </Badge>
                  )}
                </div>
              </div>

              {selectedAchievement.notes && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Notes</h4>
                  <p className="text-sm">{selectedAchievement.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false);
                setIsEditDialogOpen(true);
              }}
            >
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Achievement Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Achievement</DialogTitle>
            <DialogDescription>
              Update the achievement details.
            </DialogDescription>
          </DialogHeader>

          {selectedAchievement && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-visibility" className="text-right">
                  Visibility
                </Label>
                <Select
                  value={selectedAchievement.isPublic ? 'public' : 'private'}
                  onValueChange={(value) => setSelectedAchievement({
                    ...selectedAchievement,
                    isPublic: value === 'public'
                  })}
                >
                  <SelectTrigger id="edit-visibility" className="col-span-3">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public (visible to everyone)</SelectItem>
                    <SelectItem value="private">Private (visible to coordinators only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-notes" className="text-right">
                  Notes
                </Label>
                <Textarea
                  id="edit-notes"
                  value={selectedAchievement.notes || ''}
                  onChange={(e) => setSelectedAchievement({...selectedAchievement, notes: e.target.value})}
                  className="col-span-3"
                  placeholder="Additional notes about this achievement"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAchievement}>Update Achievement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this achievement? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedAchievement && (
            <div className="py-4">
              <p><strong>Achievement:</strong> {selectedAchievement.achievementName}</p>
              <p><strong>Teacher:</strong> {selectedAchievement.teacherName}</p>
              <p><strong>Awarded:</strong> {format(new Date(selectedAchievement.awardedAt), "PPP")}</p>
              <p><strong>Points:</strong> {selectedAchievement.points}</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAchievement}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
