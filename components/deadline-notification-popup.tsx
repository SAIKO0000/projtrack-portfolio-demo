"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Clock, User, ArrowRight, ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface TaskDeadline {
  id: string;
  title: string;
  project_name: string;
  end_date: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  daysRemaining: number;
}

interface DeadlineNotificationPopupProps {
  tasks: TaskDeadline[];
  isVisible: boolean;
  onClose: () => void;
  onTaskClick?: (taskId: string) => void;
  onViewAllClick?: () => void;
}

export function DeadlineNotificationPopup({ 
  tasks, 
  isVisible, 
  onClose, 
  onTaskClick,
  onViewAllClick
}: DeadlineNotificationPopupProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');

  // Reset index when tasks change
  useEffect(() => {
    setCurrentIndex(0);
  }, [tasks]);

  if (!isVisible || tasks.length === 0) return null;

  const currentTask = tasks[currentIndex];
  const urgentTasks = tasks.filter(task => task.daysRemaining <= 1);
  const warningTasks = tasks.filter(task => task.daysRemaining > 1 && task.daysRemaining <= 3);
  const normalTasks = tasks.filter(task => task.daysRemaining > 3);

  const getUrgencyLevel = (daysRemaining: number) => {
    if (daysRemaining === 0) return { level: 'critical', color: 'bg-red-500', text: '🚨 DUE TODAY' };
    if (daysRemaining === 1) return { level: 'urgent', color: 'bg-orange-500', text: '⚠️ DUE TOMORROW' };
    if (daysRemaining <= 3) return { level: 'warning', color: 'bg-yellow-500', text: `⏰ ${daysRemaining} DAYS LEFT` };
    return { level: 'normal', color: 'bg-blue-500', text: `📅 ${daysRemaining} DAYS LEFT` };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'border-red-200 bg-red-50 text-red-700';
      case 'medium': return 'border-yellow-200 bg-yellow-50 text-yellow-700';
      case 'low': return 'border-green-200 bg-green-50 text-green-700';
      default: return 'border-gray-200 bg-gray-50 text-gray-700';
    }
  };

  const urgency = getUrgencyLevel(currentTask.daysRemaining);

  const nextTask = () => {
    setCurrentIndex((prev) => (prev + 1) % tasks.length);
  };

  const prevTask = () => {
    setCurrentIndex((prev) => (prev - 1 + tasks.length) % tasks.length);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-4 right-4 z-50 w-80 md:w-96 max-h-[90vh] overflow-hidden"
        >
          <Card className="border-l-4 border-l-orange-500 bg-white shadow-xl backdrop-blur-sm">
            <CardContent className="p-0">
              {/* Header */}
              <div className={`px-4 py-3 ${urgency.color} text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-semibold text-sm">Task Deadline Alert</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-6 w-6 p-0 text-white hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs opacity-90">
                    {tasks.length} task{tasks.length > 1 ? 's' : ''} with upcoming deadlines
                  </span>
                  {tasks.length > 1 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode(viewMode === 'single' ? 'all' : 'single')}
                        className="h-6 px-2 text-xs text-white hover:bg-white/20"
                      >
                        {viewMode === 'single' ? 'View All' : 'Single View'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {viewMode === 'single' ? (
                <>
                  {/* Single Task View */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {currentTask.project_name}
                        </h3>
                        <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                          {currentTask.title}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-3">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(currentTask.priority)}`}
                          >
                            {currentTask.priority.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-gray-500 capitalize">
                            {currentTask.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(currentTask.end_date).toLocaleDateString()}
                          </span>
                        </div>

                        {currentTask.assigned_to && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
                            <User className="h-3 w-3" />
                            <span>{currentTask.assigned_to}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="destructive" className="text-xs font-medium">
                          {urgency.text}
                        </Badge>
                        {onTaskClick && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onTaskClick(currentTask.id)}
                            className="h-7 text-xs"
                          >
                            View
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Navigation Controls */}
                  {tasks.length > 1 && (
                    <div className="px-4 py-3 bg-gray-50 border-t">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={prevTask}
                            className="h-6 w-6 p-0"
                          >
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                          <span className="text-xs text-gray-600">
                            {currentIndex + 1} of {tasks.length}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={nextTask}
                            className="h-6 w-6 p-0"
                          >
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          {urgentTasks.length > 0 && (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-red-700 font-medium">
                                {urgentTasks.length} Critical
                              </span>
                            </div>
                          )}
                          {warningTasks.length > 0 && (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <span className="text-yellow-700 font-medium">
                                {warningTasks.length} Warning
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* All Tasks View */}
                  <div className="max-h-80 overflow-y-auto">
                    {tasks.map((task, index) => {
                      const taskUrgency = getUrgencyLevel(task.daysRemaining);
                      return (
                        <div
                          key={task.id}
                          className={`p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors ${
                            index === currentIndex ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => setCurrentIndex(index)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm text-gray-900 truncate">
                                {task.project_name}
                              </h4>
                              <p className="text-xs text-gray-600 truncate">
                                {task.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getPriorityColor(task.priority)}`}
                                >
                                  {task.priority.toUpperCase()}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {new Date(task.end_date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge 
                                variant={task.daysRemaining <= 1 ? "destructive" : "secondary"}
                                className="text-xs"
                              >
                                {taskUrgency.text}
                              </Badge>
                              {onTaskClick && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onTaskClick(task.id);
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer Actions */}
                  <div className="px-4 py-3 bg-gray-50 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs">
                        {urgentTasks.length > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-red-700 font-medium">
                              {urgentTasks.length} Critical
                            </span>
                          </div>
                        )}
                        {warningTasks.length > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span className="text-yellow-700 font-medium">
                              {warningTasks.length} Warning
                            </span>
                          </div>
                        )}
                        {normalTasks.length > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-blue-700 font-medium">
                              {normalTasks.length} Upcoming
                            </span>
                          </div>
                        )}
                      </div>
                      {onViewAllClick && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onViewAllClick}
                          className="h-6 text-xs"
                        >
                          View in Gantt
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
