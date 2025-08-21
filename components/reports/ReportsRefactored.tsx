"use client"

import { EditReportModal } from "../edit-report-modal"
import { ReviewerNotesModal } from "../reviewer-notes-modal"
import { DeleteConfirmationDialog } from "../delete-confirmation-dialog"
import { ReportsHeader } from "./ReportsHeader"
import { ReportsStatsCards } from "./ReportsStatsCards"
import { ReportsFilters } from "./ReportsFilters"
import { ReportsList } from "./ReportsList"
import { useReportsLogic } from "./useReportsLogic"
import { type ReportsProps } from "./types"

export function ReportsRefactored({ onTabChangeAction }: ReportsProps = {}) {
  // Suppress unused warning - this prop is passed down for future use
  void onTabChangeAction

  const {
    // State
    searchTerm,
    projectFilter,
    categoryFilter,
    statusFilter,
    editingReport,
    isEditModalOpen,
    reviewerNotesModal,
    deleteDialog,
    loading,
    enhancedReports,
    filteredReports,
    uniqueProjects,
    uniqueCategories,
    isAdmin,
    user,
    projects,

    // Actions
    setSearchTerm,
    setProjectFilter,
    setCategoryFilter,
    setStatusFilter,
    setIsEditModalOpen,
    setReviewerNotesModal,
    setDeleteDialog,
    handleRefresh,
    handleUploadComplete,
    handleReportStatusUpdate,
    handleReviewerNotesSubmit,
    handleView,
    handleDownload,
    handleShare,
    handleDelete,
    confirmDelete,
    handleEdit,

    // Utilities
    isAssignedReviewer,
    getReportDisplayName,
    getAssignedReviewerName,
  } = useReportsLogic()

  return (
    <div className="p-3 sm:p-5 lg:p-9 space-y-4 sm:space-y-5 lg:space-y-7 overflow-y-auto h-full bg-gradient-to-br from-gray-50 via-white to-gray-100/50 max-w-full">
      <ReportsHeader 
        onRefresh={handleRefresh}
        onUploadComplete={handleUploadComplete}
      />

      <ReportsStatsCards reports={enhancedReports} />

      <ReportsFilters
        searchTerm={searchTerm}
        projectFilter={projectFilter}
        categoryFilter={categoryFilter}
        statusFilter={statusFilter}
        uniqueProjects={uniqueProjects}
        uniqueCategories={uniqueCategories}
        onSearchChange={setSearchTerm}
        onProjectFilterChange={setProjectFilter}
        onCategoryFilterChange={setCategoryFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <ReportsList
        loading={loading}
        filteredReports={filteredReports}
        isAdmin={isAdmin}
        userId={user?.id}
        projects={projects}
        getReportDisplayName={getReportDisplayName}
        isAssignedReviewer={isAssignedReviewer}
        getAssignedReviewerName={getAssignedReviewerName}
        onView={handleView}
        onEdit={handleEdit}
        onDownload={handleDownload}
        onShare={handleShare}
        onDelete={handleDelete}
        onStatusUpdate={handleReportStatusUpdate}
        onUploadComplete={handleUploadComplete}
      />

      <EditReportModal
        report={editingReport}
        open={isEditModalOpen}
        onOpenChangeAction={setIsEditModalOpen}
        onReportUpdatedAction={handleUploadComplete}
      />

      <ReviewerNotesModal
        open={reviewerNotesModal.open}
        onOpenChangeAction={(open) => setReviewerNotesModal(prev => ({ ...prev, open }))}
        onSubmitAction={handleReviewerNotesSubmit}
        reportName={reviewerNotesModal.reportName}
        action={reviewerNotesModal.action}
      />

      <DeleteConfirmationDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, report: null, isDeleting: false })}
        onConfirm={confirmDelete}
        title="Delete Document"
        description="Are you sure you want to delete this document? This action cannot be undone."
        itemName={deleteDialog.report?.file_name}
        isLoading={deleteDialog.isDeleting}
      />
    </div>
  )
}
