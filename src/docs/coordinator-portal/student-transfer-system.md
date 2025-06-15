# Student Class Transfer System

This document describes the Student Class Transfer System implemented in the Coordinator Portal.

## Overview

The Student Class Transfer System allows coordinators to transfer students between classes and campuses. It reuses existing components and APIs from the Campus Admin portal to provide a seamless experience for coordinators.

## Components

### CoordinatorTransfersClient

The `CoordinatorTransfersClient` component is the main component for the transfers page. It provides:

- A tabbed interface for viewing transfer history and managing batch transfers
- Integration with the existing `TransferHistoryList` component
- Integration with the existing `ClassTransferManager` component
- Export functionality for transfer history

### StudentTransferButton

The `StudentTransferButton` component is a reusable button that opens a dialog for transferring a student. It's used in:

- The student profile view
- The enrollments card in the student profile

It reuses the existing `StudentTransferDialog` component from the shared entities.

## APIs

The system reuses the following existing APIs:

- `enrollment.transferStudentToClass` - For transferring a student to another class within the same campus
- `enrollment.transferStudentToCampus` - For transferring a student to another campus
- `enrollment.getTransferHistory` - For retrieving transfer history
- `class-transfer.createTransfer` - For creating individual transfer requests
- `class-transfer.createBatchTransfer` - For creating batch transfer requests

## Navigation

The system adds a "Transfers" item to the coordinator sidebar navigation, which links to the transfers page.

## Usage

### Individual Student Transfers

1. Navigate to a student's profile
2. Click the "Transfer Student" button
3. Select the transfer type (class or campus)
4. Select the destination class or campus
5. Provide a reason for the transfer (optional)
6. Submit the transfer request

### Batch Transfers

1. Navigate to the transfers page
2. Select the "Batch Transfers" tab
3. Select the source class
4. Select the destination class
5. Select the students to transfer
6. Provide a reason for the transfer (optional)
7. Submit the batch transfer request

### Viewing Transfer History

1. Navigate to the transfers page
2. View the transfer history in the "Transfer History" tab
3. Use the filters to narrow down the results
4. Export the transfer history if needed

## Implementation Details

### Reused Components

- `StudentTransferForm` - For individual student transfers
- `StudentTransferDialog` - For the transfer dialog
- `TransferHistoryList` - For viewing transfer history
- `ClassTransferManager` - For batch transfers

### New Components

- `CoordinatorTransfersClient` - Client component for the transfers page
- `StudentTransferButton` - Button for initiating transfers

### Integration Points

- The `StudentProfileView` component has been updated to include the `StudentTransferButton`
- The coordinator sidebar navigation has been updated to include a link to the transfers page
- The coordinator index file has been updated to export the new components

## Security Considerations

- Transfer operations are protected by the TRPC procedure middleware
- Only users with the appropriate roles (CAMPUS_COORDINATOR, COORDINATOR, SYSTEM_ADMIN) can access the transfer functionality
- Transfer history is filtered by the user's campus ID

## Future Enhancements

- Add approval workflow for transfers
- Add notifications for transfers
- Add transfer analytics
- Improve mobile experience for batch transfers
