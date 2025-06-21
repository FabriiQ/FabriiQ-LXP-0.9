# Teacher Portal Cleanup Commands

## Overview

This document provides specific commands and file paths for cleaning up redundant files in the teacher portal. Use these commands carefully and always test before permanent removal.

## Pre-Cleanup Verification Commands

### 1. Check File Usage Before Removal

```bash
# Check for imports of a specific file
grep -r "import.*ActivityEditor.*from.*activities/enhanced" src/

# Check for component references
grep -r "UnifiedActivityCreator" src/

# Check for type dependencies
grep -r ":ActivityEditorProps" src/

# Search for any mention of the file
find src/ -name "*.tsx" -o -name "*.ts" | xargs grep -l "ActivityEditor"
```

### 2. Verify Component Usage

```bash
# Check activities-new usage
grep -r "activities-new" src/

# Check enhanced activities usage
grep -r "activities/enhanced" src/

# Check rewards panel usage
grep -r "ClassRewardsPanel" src/
grep -r "ClassRewardsPanelOptimized" src/
```

## Phase 1: Quick Wins

### Standardize Leaderboard Imports

#### Files to Update:
```bash
# Update coordinator leaderboard
src/app/admin/coordinator/teacher-leaderboard/page.tsx

# Update principal leaderboard  
src/app/admin/principal/teacher-leaderboard/page.tsx
```

#### Commands:
```bash
# Find all leaderboard import inconsistencies
grep -r "TeacherLeaderboardView" src/app/admin/

# Find toast hook inconsistencies
grep -r "use-toast" src/app/admin/
grep -r "feedback/toast" src/app/admin/
```

### Consolidate Rewards Components

#### Files to Remove (After Migration):
```bash
src/components/teacher/rewards/ClassRewardsPanel.tsx
```

#### Verification Commands:
```bash
# Check ClassRewardsPanel usage
grep -r "ClassRewardsPanel[^O]" src/

# Check ClassRewardsPanelOptimized usage
grep -r "ClassRewardsPanelOptimized" src/

# Find all rewards imports
grep -r "from.*rewards" src/
```

## Phase 2: Activities Cleanup

### Files to Remove (After Migration):

```bash
# Enhanced activities directory (remove entire directory)
src/components/teacher/activities/enhanced/

# Specific files in enhanced directory:
src/components/teacher/activities/enhanced/ActivityEditor.tsx
src/components/teacher/activities/enhanced/ActivityViewer.tsx
src/components/teacher/activities/enhanced/UnifiedActivityCreator.tsx
src/components/teacher/activities/enhanced/ActivityTypeSelectorGrid.tsx
src/components/teacher/activities/enhanced/ActivityAnalyticsWrapper.tsx
src/components/teacher/activities/enhanced/ActivityList.tsx
src/components/teacher/activities/enhanced/ActivityRegistryProvider.tsx
src/components/teacher/activities/enhanced/MinimalistActivityComparison.tsx
src/components/teacher/activities/enhanced/MinimalistActivityEngagementDashboard.tsx
src/components/teacher/activities/enhanced/TimeTrackingDashboard.tsx
src/components/teacher/activities/enhanced/index.ts
src/components/teacher/activities/enhanced/index.ts.new
```

### Migration Commands:

```bash
# Find all enhanced activities imports
grep -r "activities/enhanced" src/

# Find all activities-new imports
grep -r "activities-new" src/

# Check for any remaining enhanced references
grep -r "enhanced.*Activity" src/
```

### Safe Removal Process:

```bash
# Step 1: Comment out enhanced directory exports
# Edit src/components/teacher/activities/enhanced/index.ts
# Comment out all exports

# Step 2: Test application
npm run build
npm run test

# Step 3: If no errors, remove directory
rm -rf src/components/teacher/activities/enhanced/

# Step 4: Update any remaining imports
# Search and replace enhanced imports with activities-new imports
```

## Phase 3: Cross-Portal Components (Future)

### Files to Eventually Remove:

```bash
# Coordinator specific teacher components
src/components/coordinator/TeacherGrid.tsx
src/components/coordinator/MobileTeacherGrid.tsx
src/components/coordinator/TeacherProfileView.tsx
src/components/coordinator/TeacherManagementDashboard.tsx

# Campus specific teacher components
src/components/campus/TeacherProfileCard.tsx
src/components/campus/TeacherOverviewTab.tsx
src/components/campus/TeacherClassesTab.tsx

# System specific teacher components
src/components/system/SystemTeacherForm.tsx
src/components/system/SystemTeachersContent.tsx
```

### Migration Target:
```bash
# Unified teacher components (already exists, needs completion)
src/components/shared/entities/teachers/
```

## Verification Scripts

### Create Verification Script:

```bash
# Create cleanup-verification.sh
cat > cleanup-verification.sh << 'EOF'
#!/bin/bash

echo "=== Teacher Portal Cleanup Verification ==="
echo

echo "1. Checking for enhanced activities imports..."
enhanced_imports=$(grep -r "activities/enhanced" src/ 2>/dev/null | wc -l)
echo "Enhanced activities imports found: $enhanced_imports"

echo "2. Checking for activities-new imports..."
new_imports=$(grep -r "activities-new" src/ 2>/dev/null | wc -l)
echo "Activities-new imports found: $new_imports"

echo "3. Checking for ClassRewardsPanel usage..."
old_rewards=$(grep -r "ClassRewardsPanel[^O]" src/ 2>/dev/null | wc -l)
echo "Old rewards panel usage: $old_rewards"

echo "4. Checking for ClassRewardsPanelOptimized usage..."
new_rewards=$(grep -r "ClassRewardsPanelOptimized" src/ 2>/dev/null | wc -l)
echo "Optimized rewards panel usage: $new_rewards"

echo "5. Checking for leaderboard import inconsistencies..."
toast_feedback=$(grep -r "feedback/toast" src/app/admin/ 2>/dev/null | wc -l)
toast_use=$(grep -r "use-toast" src/app/admin/ 2>/dev/null | wc -l)
echo "Feedback/toast imports: $toast_feedback"
echo "Use-toast imports: $toast_use"

echo
echo "=== Summary ==="
if [ $enhanced_imports -eq 0 ]; then
    echo "✅ Enhanced activities cleanup: COMPLETE"
else
    echo "❌ Enhanced activities cleanup: PENDING ($enhanced_imports imports found)"
fi

if [ $old_rewards -eq 0 ]; then
    echo "✅ Rewards panel cleanup: COMPLETE"
else
    echo "❌ Rewards panel cleanup: PENDING ($old_rewards usages found)"
fi

if [ $toast_feedback -eq $toast_use ]; then
    echo "✅ Toast imports: CONSISTENT"
else
    echo "❌ Toast imports: INCONSISTENT (feedback: $toast_feedback, use-toast: $toast_use)"
fi
EOF

chmod +x cleanup-verification.sh
```

### Run Verification:
```bash
./cleanup-verification.sh
```

## Safety Checklist

Before removing any file:

- [ ] Run verification commands
- [ ] Check for imports: `grep -r "filename" src/`
- [ ] Check for references: `grep -r "ComponentName" src/`
- [ ] Test build: `npm run build`
- [ ] Test functionality in browser
- [ ] Create backup branch
- [ ] Document changes

## Rollback Commands

If issues are found after cleanup:

```bash
# Restore from backup branch
git checkout backup-branch -- src/components/teacher/activities/enhanced/

# Or restore specific file
git checkout HEAD~1 -- src/components/teacher/rewards/ClassRewardsPanel.tsx

# Check git history for removed files
git log --oneline --follow -- src/components/teacher/activities/enhanced/
```

## Post-Cleanup Verification

```bash
# Build check
npm run build

# Type check
npm run type-check

# Test suite
npm run test

# Lint check
npm run lint

# Bundle size check
npm run analyze
```

---

**⚠️ Warning**: Always test thoroughly before permanent removal. Keep backups and have a rollback plan ready.

**📝 Note**: Update this document as cleanup progresses and new redundancies are discovered.
