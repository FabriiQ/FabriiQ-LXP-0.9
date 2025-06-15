# Profile Components

This directory contains components for user profile management in the AIVY LXP application.

## Components Overview

### ProfileDisplay

Displays user profile information including name, email, username, user type, phone number, date of birth, and profile image.

**Props:**
- `user`: User object containing profile information
- `onEdit`: Callback function for edit button
- `onChangePassword`: Callback function for change password button

**Usage:**
```tsx
import { ProfileDisplay } from '@/components/profile';

<ProfileDisplay 
  user={userData} 
  onEdit={handleEdit} 
  onChangePassword={handlePasswordChange} 
/>
```

### ProfileEditForm

Form for editing user profile information.

**Props:**
- `user`: User object containing profile information
- `onSubmit`: Callback function for form submission
- `onCancel`: Callback function for cancel button
- `isSubmitting`: Boolean indicating if form is submitting

**Usage:**
```tsx
import { ProfileEditForm } from '@/components/profile';

<ProfileEditForm 
  user={userData} 
  onSubmit={handleSubmit} 
  onCancel={handleCancel} 
  isSubmitting={isSubmitting} 
/>
```

### ProfileImageUpload

Component for uploading and previewing profile images.

**Props:**
- `initialImage`: Initial image URL (optional)
- `onImageChange`: Callback function when image changes
- `className`: Additional CSS classes (optional)
- `size`: Size of the image container in pixels (default: 128)

**Usage:**
```tsx
import { ProfileImageUpload } from '@/components/profile';

<ProfileImageUpload 
  initialImage={user.profileImageUrl} 
  onImageChange={handleImageChange} 
  size={150} 
/>
```

### PasswordChangeForm

Form for changing user password.

**Props:**
- `onSubmit`: Callback function for form submission
- `onCancel`: Callback function for cancel button
- `isSubmitting`: Boolean indicating if form is submitting

**Usage:**
```tsx
import { PasswordChangeForm } from '@/components/profile';

<PasswordChangeForm 
  onSubmit={handlePasswordChange} 
  onCancel={handleCancel} 
  isSubmitting={isSubmitting} 
/>
```

## Integration with Backend

These components are designed to work with the TRPC API endpoints for user profile management:

- `api.user.getProfile`: Fetches user profile data
- `api.user.updateProfile`: Updates user profile information
- `api.user.changePassword`: Changes user password
- `api.user.uploadProfileImage`: Uploads profile image (if implemented separately)

## Validation

Form validation is implemented using Zod schemas:

- Profile form validates name, phone number, and date of birth
- Password form validates current password, new password (with complexity requirements), and password confirmation

## Accessibility

These components are designed with accessibility in mind:

- All form fields have proper labels
- Error messages are associated with their respective inputs
- Focus states are clearly visible
- Color contrast meets WCAG standards

## Responsive Design

All components are fully responsive and work well on mobile, tablet, and desktop devices.

## Future Improvements

Potential future improvements for these components:

1. Add support for additional profile fields based on user type
2. Implement role-based field visibility
3. Add multi-language support
4. Enhance image upload with cropping functionality
5. Add two-factor authentication setup 