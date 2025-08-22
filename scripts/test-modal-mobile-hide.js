#!/usr/bin/env node

/**
 * Test script to verify modal mobile hide functionality
 * This script checks that all modal components have the useModalMobileHide hook imported and used
 */

const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '..', 'components');

// List of modal components that should have the hook
const modalComponents = [
  'edit-project-modal.tsx',
  'edit-report-modal.tsx',
  'event-form-modal.tsx',
  'document-viewer-with-notes-modal.tsx',
  'project-form-modal.tsx',
  'report-upload-modal.tsx',
  'reviewer-notes-modal.tsx',
  'task-notes-modal.tsx',
  'simple-notes-modal.tsx',
  'notes-only-modal.tsx',
  'profile-modal.tsx',
  'delete-event-dialog.tsx',
  'delete-confirmation-dialog.tsx',
  'gantt/TaskFormModal.tsx',
  'gantt/TaskEditModal.tsx',
  'gantt/TaskNotesModal.tsx',
];

console.log('🔍 Checking modal components for mobile hide functionality...\n');

let allPassed = true;

modalComponents.forEach(componentPath => {
  const fullPath = path.join(componentsDir, componentPath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ ${componentPath}: File does not exist`);
    allPassed = false;
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  
  // Check for import
  const hasImport = content.includes('useModalMobileHide');
  
  // Check for usage (should appear after import)
  const hasUsage = content.includes('useModalMobileHide(');
  
  if (hasImport && hasUsage) {
    console.log(`✅ ${componentPath}: Mobile hide hook implemented`);
  } else if (!hasImport) {
    console.log(`❌ ${componentPath}: Missing import for useModalMobileHide`);
    allPassed = false;
  } else if (!hasUsage) {
    console.log(`❌ ${componentPath}: Import found but hook not used`);
    allPassed = false;
  }
});

console.log('\n🎯 Checking CSS for mobile header hide class...');
const globalCssPath = path.join(__dirname, '..', 'app', 'globals.css');
if (fs.existsSync(globalCssPath)) {
  const cssContent = fs.readFileSync(globalCssPath, 'utf8');
  if (cssContent.includes('.modal-mobile-open .sidebar-mobile-header')) {
    console.log('✅ CSS rule for hiding mobile header found');
  } else {
    console.log('❌ CSS rule for hiding mobile header not found');
    allPassed = false;
  }
} else {
  console.log('❌ globals.css not found');
  allPassed = false;
}

console.log('\n🎯 Checking sidebar mobile header for CSS class...');
const sidebarHeaderPath = path.join(componentsDir, 'sidebar', 'SidebarMobileHeader.tsx');
if (fs.existsSync(sidebarHeaderPath)) {
  const headerContent = fs.readFileSync(sidebarHeaderPath, 'utf8');
  if (headerContent.includes('sidebar-mobile-header')) {
    console.log('✅ Sidebar mobile header has the correct CSS class');
  } else {
    console.log('❌ Sidebar mobile header missing sidebar-mobile-header class');
    allPassed = false;
  }
} else {
  console.log('❌ SidebarMobileHeader.tsx not found');
  allPassed = false;
}

console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('🎉 All checks passed! Mobile modal functionality should work correctly.');
} else {
  console.log('❌ Some checks failed. Please review the issues above.');
  process.exit(1);
}
