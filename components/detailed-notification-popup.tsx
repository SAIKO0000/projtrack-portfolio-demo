"use client"

import { useState } from 'react'

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

interface DetailedNotificationPopupProps {
  tasks: TaskDeadline[];
  onDismissAction: () => void;
  onTaskClickAction: (taskId: string) => void;
  onViewAllAction: () => void;
}

export function DetailedNotificationPopup({ 
  tasks, 
  onDismissAction, 
  onTaskClickAction, 
  onViewAllAction 
}: DetailedNotificationPopupProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (tasks.length === 0) return null;
  
  const currentTask = tasks[currentIndex];
  
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-500 text-white';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return null; // Don't show medium or unknown priorities
    }
  };
  
  const formatPriority = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'High';
      case 'low':
        return 'Low';
      default:
        return null; // Don't show medium or unknown priorities
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'in-progress':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };
  
  const formatStatus = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'in-progress':
        return 'In-Progress';
      case 'pending':
        return 'Pending';
      case 'completed':
        return 'Completed';
      default:
        return status || 'Pending';
    }
  };
  
  const getDaysLeftColor = (days: number) => {
    if (days <= 1) return 'bg-red-500 text-white';
    if (days <= 3) return 'bg-orange-500 text-white';
    if (days <= 7) return 'bg-yellow-500 text-white';
    return 'bg-blue-500 text-white';
  };
  
  const getDaysLeftText = (days: number) => {
    if (days < 0) return `${Math.abs(days)} DAYS OVERDUE`;
    if (days === 0) return 'DUE TODAY';
    if (days === 1) return '1 DAY LEFT';
    return `${days} DAYS LEFT`;
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const criticalCount = tasks.filter(task => task.daysRemaining <= 1).length;
  const warningCount = tasks.filter(task => task.daysRemaining > 1 && task.daysRemaining <= 7).length;
  
  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-lg">Task Deadline Alert</span>
            </div>
            <button 
              onClick={onDismissAction}
              className="text-white hover:text-gray-200 p-1 rounded text-xl"
            >
              ×
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-lg">
              {tasks.length} task{tasks.length > 1 ? 's' : ''} with upcoming deadlines
            </span>
            <button 
              onClick={onViewAllAction}
              className="text-white hover:text-gray-200 underline text-sm font-medium"
            >
              View All
            </button>
          </div>
        </div>
        
        {/* Task Details */}
        <div className="p-4 bg-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Project and Task Name */}
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {currentTask.project_name}
              </h3>
              <p className="text-gray-600 mb-3">{currentTask.title}</p>
              
              {/* Priority, Status, Date */}
              <div className="flex items-center gap-3 mb-3">
                {getPriorityColor(currentTask.priority) && (
                  <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${getPriorityColor(currentTask.priority)}`}>
                    {formatPriority(currentTask.priority)}
                  </span>
                )}
                <span className={`text-sm font-medium ${getStatusColor(currentTask.status)}`}>
                  {formatStatus(currentTask.status)}
                </span>
                <span className="text-gray-500 text-sm">
                  {formatDate(currentTask.end_date)}
                </span>
              </div>
            </div>
            
            {/* Days Left Badge */}
            <div className="ml-4">
              <div className={`px-3 py-2 rounded-full text-sm font-bold whitespace-nowrap ${getDaysLeftColor(currentTask.daysRemaining)}`}>
                <div className="flex items-center gap-1">
                  {currentTask.daysRemaining <= 1 && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  {getDaysLeftText(currentTask.daysRemaining)}
                </div>
              </div>
            </div>
          </div>
          
          {/* View Button */}
          <button 
            onClick={() => onTaskClickAction(currentTask.id)}
            className="w-full mt-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            View
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Navigation and Summary */}
        {tasks.length > 1 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              {/* Navigation */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <span className="text-sm text-gray-600 font-medium">
                  {currentIndex + 1} of {tasks.length}
                </span>
                
                <button 
                  onClick={() => setCurrentIndex(Math.min(tasks.length - 1, currentIndex + 1))}
                  disabled={currentIndex === tasks.length - 1}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              {/* Summary Indicators */}
              <div className="flex items-center gap-3 text-sm">
                {criticalCount > 0 && (
                  <div className="flex items-center gap-1 text-red-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="font-medium">{criticalCount} Critical</span>
                  </div>
                )}
                {warningCount > 0 && (
                  <div className="flex items-center gap-1 text-orange-600">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="font-medium">{warningCount} Warning</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
