# Dialog Components Replacement Guide

This document lists all locations where browser `alert()`, `confirm()`, and `prompt()` need to be replaced with custom dialog components.

## Created Components

### 1. `AlertDialog.jsx` - For alerts/notifications
- Replaces: `alert()` and `window.alert()`
- Variants: `success`, `error`, `warning`, `info`
- Usage:
```jsx
import AlertDialog from '../components/AlertDialog';

const [alert, setAlert] = useState({ isOpen: false, title: '', message: '', variant: 'info' });

<AlertDialog
  isOpen={alert.isOpen}
  onClose={() => setAlert({ ...alert, isOpen: false })}
  title={alert.title}
  message={alert.message}
  variant={alert.variant}
/>

// Show alert
setAlert({
  isOpen: true,
  title: 'Error',
  message: 'Failed to upload image',
  variant: 'error'
});
```

### 2. `ConfirmDialog.jsx` - For confirmations
- Replaces: `confirm()` and `window.confirm()`
- Variants: `danger`, `warning`, `info`
- Usage:
```jsx
import ConfirmDialog from '../components/ConfirmDialog';

const [confirm, setConfirm] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

<ConfirmDialog
  isOpen={confirm.isOpen}
  onClose={() => setConfirm({ ...confirm, isOpen: false })}
  onConfirm={confirm.onConfirm}
  title={confirm.title}
  message={confirm.message}
  variant="danger"
  confirmText="Delete"
/>

// Show confirmation
setConfirm({
  isOpen: true,
  title: 'Delete Task',
  message: 'Are you sure you want to delete this task? This cannot be undone.',
  onConfirm: () => {
    // Handle delete
    setConfirm({ ...confirm, isOpen: false });
  }
});
```

### 3. `PromptDialog.jsx` - For text input
- Replaces: `prompt()` and `window.prompt()`
- Supports: text input and textarea
- Usage:
```jsx
import PromptDialog from '../components/PromptDialog';

const [prompt, setPrompt] = useState({ isOpen: false, title: '', message: '', onSubmit: null });

<PromptDialog
  isOpen={prompt.isOpen}
  onClose={() => setPrompt({ ...prompt, isOpen: false })}
  onSubmit={prompt.onSubmit}
  title={prompt.title}
  message={prompt.message}
  placeholder="Enter reason..."
  inputType="textarea"
  required
/>

// Show prompt
setPrompt({
  isOpen: true,
  title: 'Suspension Reason',
  message: 'Please provide a reason for suspending this user:',
  onSubmit: (value) => {
    // Handle submission with value
    setPrompt({ ...prompt, isOpen: false });
  }
});
```

---

## Files to Update

### 1. `client/src/pages/Profile.jsx` (3 alerts)

**Line 92-94:**
```jsx
// BEFORE:
alert('Please upload an image file');

// AFTER:
setAlert({
  isOpen: true,
  title: 'Invalid File',
  message: 'Please upload an image file',
  variant: 'warning'
});
```

**Line 98-100:**
```jsx
// BEFORE:
alert('Image size should be less than 5MB');

// AFTER:
setAlert({
  isOpen: true,
  title: 'File Too Large',
  message: 'Image size should be less than 5MB',
  variant: 'warning'
});
```

**Line 123-126:**
```jsx
// BEFORE:
alert(error.response?.data?.error?.message || 'Failed to upload image. Please try again.');

// AFTER:
setAlert({
  isOpen: true,
  title: 'Upload Failed',
  message: error.response?.data?.error?.message || 'Failed to upload image. Please try again.',
  variant: 'error'
});
```

---

### 2. `client/src/pages/buyer/MyPosts.jsx` (3 instances)

**Line 44:**
```jsx
// BEFORE:
alert('Failed to update task visibility');

// AFTER:
setAlert({
  isOpen: true,
  title: 'Update Failed',
  message: 'Failed to update task visibility',
  variant: 'error'
});
```

**Line 49-51:**
```jsx
// BEFORE:
if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
  return;
}

// AFTER:
setConfirm({
  isOpen: true,
  title: 'Delete Task',
  message: 'Are you sure you want to delete this task? This action cannot be undone.',
  variant: 'danger',
  confirmText: 'Delete',
  onConfirm: async () => {
    setConfirm({ ...confirm, isOpen: false });
    // ... rest of delete logic
  }
});
return;
```

**Line 58:**
```jsx
// BEFORE:
alert('Failed to delete task');

// AFTER:
setAlert({
  isOpen: true,
  title: 'Delete Failed',
  message: 'Failed to delete task',
  variant: 'error'
});
```

---

### 3. `client/src/pages/buyer/BidsTracking.jsx` (2 alerts)

**Line 70:**
```jsx
// BEFORE:
alert('Failed to accept bid');

// AFTER:
setAlert({
  isOpen: true,
  title: 'Action Failed',
  message: 'Failed to accept bid',
  variant: 'error'
});
```

**Line 80:**
```jsx
// BEFORE:
alert('Failed to reject bid');

// AFTER:
setAlert({
  isOpen: true,
  title: 'Action Failed',
  message: 'Failed to reject bid',
  variant: 'error'
});
```

---

### 4. `client/src/pages/TaskDetail.jsx` (2 confirms)

**Line 109-111:**
```jsx
// BEFORE:
if (confirm('Are you sure you want to accept this bid?')) {
  acceptBidMutation.mutate(bidId);
}

// AFTER:
setConfirm({
  isOpen: true,
  title: 'Accept Bid',
  message: 'Are you sure you want to accept this bid?',
  variant: 'info',
  onConfirm: () => {
    acceptBidMutation.mutate(bidId);
    setConfirm({ ...confirm, isOpen: false });
  }
});
```

**Line 120-122:**
```jsx
// BEFORE:
if (confirm('Are you sure you want to cancel this task?')) {
  updateStatusMutation.mutate('cancelled');
}

// AFTER:
setConfirm({
  isOpen: true,
  title: 'Cancel Task',
  message: 'Are you sure you want to cancel this task?',
  variant: 'warning',
  onConfirm: () => {
    updateStatusMutation.mutate('cancelled');
    setConfirm({ ...confirm, isOpen: false });
  }
});
```

---

### 5. `client/src/pages/MyGigs.jsx` (1 confirm)

**Line 82-84:**
```jsx
// BEFORE:
if (window.confirm(`Delete "${gig.title}"? This also removes its requests.`)) {
  deleteMutation.mutate(gig.id);
}

// AFTER:
setConfirm({
  isOpen: true,
  title: 'Delete Gig',
  message: `Delete "${gig.title}"? This also removes its requests.`,
  variant: 'danger',
  confirmText: 'Delete',
  onConfirm: () => {
    deleteMutation.mutate(gig.id);
    setConfirm({ ...confirm, isOpen: false });
  }
});
```

---

### 6. `client/src/pages/MyGigOrders.jsx` (1 confirm)

**Line 154-157:**
```jsx
// BEFORE:
if (window.confirm('Cancel this gig request?')) {
  cancelMutation.mutate(order.id);
}

// AFTER:
setConfirm({
  isOpen: true,
  title: 'Cancel Request',
  message: 'Cancel this gig request?',
  variant: 'warning',
  onConfirm: () => {
    cancelMutation.mutate(order.id);
    setConfirm({ ...confirm, isOpen: false });
  }
});
```

---

### 7. `client/src/pages/admin/AdminUsers.jsx` (3 instances)

**Line 111:**
```jsx
// BEFORE:
if (!window.confirm(`Reinstate ${user.full_name}?`)) return;

// AFTER:
setConfirm({
  isOpen: true,
  title: 'Reinstate User',
  message: `Reinstate ${user.full_name}?`,
  variant: 'info',
  onConfirm: async () => {
    setConfirm({ ...confirm, isOpen: false });
    // ... rest of reinstate logic
  }
});
return;
```

**Line 124-127:**
```jsx
// BEFORE:
const reason = window.prompt(`Reason for suspending ${user.full_name}:`);
if (reason === null) return;
if (!reason.trim()) {
  setError('A suspension reason is required');
  return;
}

// AFTER:
setPrompt({
  isOpen: true,
  title: 'Suspend User',
  message: `Reason for suspending ${user.full_name}:`,
  placeholder: 'Enter suspension reason...',
  inputType: 'textarea',
  onSubmit: async (reason) => {
    setPrompt({ ...prompt, isOpen: false });
    // ... rest of suspend logic with reason
  }
});
return;
```

**Line 143-146:**
```jsx
// BEFORE:
const confirmed = window.confirm(
  `Permanently delete ${user.full_name}? Their tasks, bids and messages will also be removed.`
);
if (!confirmed) return;

// AFTER:
setConfirm({
  isOpen: true,
  title: 'Delete User',
  message: `Permanently delete ${user.full_name}? Their tasks, bids and messages will also be removed.`,
  variant: 'danger',
  confirmText: 'Delete Permanently',
  onConfirm: async () => {
    setConfirm({ ...confirm, isOpen: false });
    // ... rest of delete logic
  }
});
return;
```

---

### 8. `client/src/pages/admin/AdminTasks.jsx` (1 confirm)

**Line 82:**
```jsx
// BEFORE:
if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;

// AFTER:
setConfirm({
  isOpen: true,
  title: 'Delete Task',
  message: `Delete "${task.title}"? This cannot be undone.`,
  variant: 'danger',
  confirmText: 'Delete',
  onConfirm: async () => {
    setConfirm({ ...confirm, isOpen: false });
    // ... rest of delete logic
  }
});
return;
```

---

### 9. `client/src/pages/admin/AdminGigs.jsx` (2 instances)

**Line 49-51:**
```jsx
// BEFORE:
if (!window.confirm(`Are you sure you want to delete the gig "${gigTitle}"? This cannot be undone.`)) {
  return;
}

// AFTER:
setConfirm({
  isOpen: true,
  title: 'Delete Gig',
  message: `Are you sure you want to delete the gig "${gigTitle}"? This cannot be undone.`,
  variant: 'danger',
  confirmText: 'Delete',
  onConfirm: async () => {
    setConfirm({ ...confirm, isOpen: false });
    // ... rest of delete logic
  }
});
return;
```

**Line 59:**
```jsx
// BEFORE:
alert('Failed to delete gig. Please try again.');

// AFTER:
setAlert({
  isOpen: true,
  title: 'Delete Failed',
  message: 'Failed to delete gig. Please try again.',
  variant: 'error'
});
```

---

### 10. `client/src/pages/admin/AdminFeedback.jsx` (2 confirms)

**Line 71:**
```jsx
// BEFORE:
if (!window.confirm('Delete this review? This cannot be undone.')) return;

// AFTER:
setConfirm({
  isOpen: true,
  title: 'Delete Review',
  message: 'Delete this review? This cannot be undone.',
  variant: 'danger',
  confirmText: 'Delete',
  onConfirm: async () => {
    setConfirm({ ...confirm, isOpen: false });
    // ... rest of delete logic
  }
});
return;
```

**Line 84:**
```jsx
// BEFORE:
if (!window.confirm('Delete this message? This cannot be undone.')) return;

// AFTER:
setConfirm({
  isOpen: true,
  title: 'Delete Message',
  message: 'Delete this message? This cannot be undone.',
  variant: 'danger',
  confirmText: 'Delete',
  onConfirm: async () => {
    setConfirm({ ...confirm, isOpen: false });
    // ... rest of delete logic
  }
});
return;
```

---

## Summary

### Total Replacements Needed:
- **alert()**: 8 instances across 5 files
- **confirm()**: 13 instances across 8 files
- **prompt()**: 1 instance in 1 file

### Files Affected:
1. ✅ Profile.jsx (3 alerts)
2. ✅ MyPosts.jsx (1 confirm, 2 alerts)
3. ✅ BidsTracking.jsx (2 alerts)
4. ✅ TaskDetail.jsx (2 confirms) - Already has one custom modal
5. ✅ MyGigs.jsx (1 confirm)
6. ✅ MyGigOrders.jsx (1 confirm)
7. ✅ AdminUsers.jsx (2 confirms, 1 prompt)
8. ✅ AdminTasks.jsx (1 confirm)
9. ✅ AdminGigs.jsx (1 confirm, 1 alert)
10. ✅ AdminFeedback.jsx (2 confirms)

### Implementation Steps:
1. Import the required dialog component(s) in each file
2. Add state management for dialog visibility and data
3. Replace browser dialog calls with state setters
4. Add the dialog component to JSX
5. Test each replacement

### Benefits:
- ✨ Consistent, modern UI
- 🎨 Customizable styling
- 📱 Mobile-friendly
- ♿ Accessibility support
- 🎭 Loading states
- 🎯 Better UX with proper animations
- 🔒 Cannot be blocked by browser settings
