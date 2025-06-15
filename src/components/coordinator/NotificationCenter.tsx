'use client';

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell,
  Check,
  X,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  BookOpen,
  Users,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading";
import { useToast } from "@/components/ui/feedback/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: string;
  notificationId: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
  sender: {
    id: string;
    name: string;
    email: string;
  };
}

export function NotificationCenter() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch notifications
  const { data, isLoading, refetch } = api.notification.list.useQuery({
    take: 10,
  });

  // Mark notification as read mutation
  const markAsRead = api.notification.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark notification as read",
        variant: "destructive",
      });
    },
  });

  // Mark all as read mutation
  const markAllAsRead = api.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
      toast({
        title: "Success",
        description: "All notifications marked as read",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark all notifications as read",
        variant: "destructive",
      });
    },
  });

  // Handle marking a notification as read
  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  // Handle marking all notifications as read
  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  // Filter notifications based on active tab
  const filteredNotifications = data?.notifications?.filter(notification => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.isRead;
    return notification.type.toLowerCase() === activeTab.toLowerCase();
  }) || [];

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'info':
      case 'system':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'warning':
      case 'attendance_warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'success':
      case 'achievement':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'schedule':
      case 'schedule_change':
        return <Clock className="h-5 w-5 text-purple-500" />;
      case 'academic':
      case 'course':
        return <BookOpen className="h-5 w-5 text-indigo-500" />;
      case 'attendance':
      case 'attendance_reminder':
        return <Calendar className="h-5 w-5 text-orange-500" />;
      case 'user':
      case 'student':
        return <Users className="h-5 w-5 text-cyan-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  // Format notification date
  const formatDate = (date: Date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return notificationDate.toLocaleDateString();
    }
  };

  return (
    <Card className={`w-full transition-all duration-300 ${isExpanded ? 'h-[500px]' : 'h-[400px]'}`}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Notifications
            {data?.unreadCount && data.unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {data.unreadCount}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Stay updated with program activities
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="px-4 pt-2">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="academic">Academic</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="m-0">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <p className="text-sm text-muted-foreground">
                {filteredNotifications.length} {filteredNotifications.length === 1 ? 'notification' : 'notifications'}
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleMarkAllAsRead}
                disabled={markAllAsRead.isLoading || filteredNotifications.length === 0}
              >
                Mark all as read
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-[300px]">
                <LoadingSpinner />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-[300px] text-center p-4">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No notifications</p>
                <p className="text-sm text-muted-foreground">
                  You don't have any {activeTab !== "all" ? activeTab : ""} notifications at the moment
                </p>
              </div>
            ) : (
              <ScrollArea className={`h-[${isExpanded ? '400px' : '300px'}]`}>
                <div className="space-y-1 p-1">
                  {filteredNotifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`flex items-start space-x-3 p-3 rounded-md transition-colors ${
                        notification.isRead ? 'bg-background' : 'bg-muted/50'
                      } hover:bg-muted`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <p className={`text-sm font-medium ${!notification.isRead && 'font-semibold'}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {notification.content}
                        </p>
                        {!notification.isRead && (
                          <div className="flex justify-end mt-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2"
                              onClick={() => handleMarkAsRead(notification.id)}
                              disabled={markAsRead.isLoading}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Mark as read
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
