import { renderHook, act } from '@testing-library/react-hooks/dom'; // Using /dom for react-hooks
import { useOfflineSupport } from './hooks'; // DEFAULT_OFFLINE_CONFIG is also in here
import * as syncManager from './sync';
import { api } from '@/trpc/react';
import * as analytics from './analytics';

// Mock the entire tRPC api client
jest.mock('@/trpc/react', () => ({
  api: {
    useContext: jest.fn(),
  },
}));

// Mock the syncManager module
jest.mock('./sync', () => ({
  ...jest.requireActual('./sync'), // Import and retain original enums like SyncStatus
  syncTeacherData: jest.fn(),
  isOnline: jest.fn(() => true), // Assume online for most tests here
  addSyncListener: jest.fn(),
  removeSyncListener: jest.fn(),
}));

// Mock analytics functions if they are called within the hook
jest.mock('./analytics', () => ({
  trackOfflineModeEnter: jest.fn(),
  trackOfflineModeExit: jest.fn(),
}));


describe('useOfflineSupport', () => {
  const mockInvalidateTeacher = jest.fn().mockResolvedValue(undefined); // Mock invalidate to resolve
  const mockInvalidateAssessment = jest.fn().mockResolvedValue(undefined);
  const mockInvalidateAttendance = jest.fn().mockResolvedValue(undefined);
  const mockSyncTeacherData = syncManager.syncTeacherData as jest.Mock;
  const mockApiUseContext = api.useContext as jest.Mock;
  const mockIsOnline = syncManager.isOnline as jest.Mock;
  const mockAddSyncListener = syncManager.addSyncListener as jest.Mock;
  const mockRemoveSyncListener = syncManager.removeSyncListener as jest.Mock;

  let originalWindowAddEventListener: typeof window.addEventListener;
  let originalWindowRemoveEventListener: typeof window.removeEventListener;
  const eventMap: Record<string, Function> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiUseContext.mockReturnValue({
      teacher: { invalidate: mockInvalidateTeacher },
      assessment: { invalidate: mockInvalidateAssessment },
      attendance: { invalidate: mockInvalidateAttendance },
    });
    mockIsOnline.mockReturnValue(true); // Default to online

    // Mock window event listeners for online/offline
    originalWindowAddEventListener = window.addEventListener;
    originalWindowRemoveEventListener = window.removeEventListener;
    window.addEventListener = jest.fn((event, cb) => {
      eventMap[event] = cb as Function;
    });
    window.removeEventListener = jest.fn((event, cb) => {
      // Simple removal, actual map key removal might be needed if complex
    });
  });

  afterEach(() => {
    window.addEventListener = originalWindowAddEventListener;
    window.removeEventListener = originalWindowRemoveEventListener;
  });

  it('should call syncTeacherData and invalidate queries on coming online if autoSync is true', async () => {
    mockSyncTeacherData.mockResolvedValue({ status: syncManager.SyncStatus.SUCCESS, syncedCount: 1, failedCount: 0, errors: [] });

    const { rerender, result } = renderHook(
        ({ teacherId, autoSync }) => useOfflineSupport({ teacherId, enabled: true, config: { autoSync } }),
        { initialProps: { teacherId: 't1', autoSync: true } }
    );

    // Simulate going offline (this will set up offlineStartTimeRef.current)
    await act(async () => {
      mockIsOnline.mockReturnValue(false);
      if(eventMap.offline) eventMap.offline();
    });

    // Simulate going online
    await act(async () => {
      mockIsOnline.mockReturnValue(true);
      if(eventMap.online) eventMap.online(); // This internally calls syncTeacherData -> invalidate
    });

    // Ensure all promises resolve. The hook's useEffect for online/offline calls handleOnline,
    // which is async and calls syncTeacherData. The result of syncTeacherData then calls invalidate.
    // Waiting for the mockSyncTeacherData to have been called is a good way to ensure the flow proceeded.
    await expect(mockSyncTeacherData).toHaveBeenCalled();

    expect(mockInvalidateTeacher).toHaveBeenCalled();
    expect(mockInvalidateAssessment).toHaveBeenCalled();
    expect(mockInvalidateAttendance).toHaveBeenCalled();
  });

  it('should call invalidate queries after successful manual sync with synced items', async () => {
    mockSyncTeacherData.mockResolvedValue({ status: syncManager.SyncStatus.SUCCESS, syncedCount: 1, failedCount: 0, errors: [] });
    const { result } = renderHook(() => useOfflineSupport({ teacherId: 't1' }));

    await act(async () => {
      await result.current.syncTeacher();
    });

    expect(mockSyncTeacherData).toHaveBeenCalledWith(true); // forceSync = true
    expect(mockInvalidateTeacher).toHaveBeenCalled();
    expect(mockInvalidateAssessment).toHaveBeenCalled();
    expect(mockInvalidateAttendance).toHaveBeenCalled();
  });

  it('should NOT invalidate queries if sync was successful but no items were synced', async () => {
    mockSyncTeacherData.mockResolvedValue({ status: syncManager.SyncStatus.SUCCESS, syncedCount: 0, failedCount: 0, errors: [] });
    const { result } = renderHook(() => useOfflineSupport({ teacherId: 't1' }));

    await act(async () => {
      await result.current.syncTeacher();
    });

    expect(mockInvalidateTeacher).not.toHaveBeenCalled();
  });

  it('should NOT invalidate queries if sync failed', async () => {
    mockSyncTeacherData.mockResolvedValue({ status: syncManager.SyncStatus.ERROR, syncedCount: 0, failedCount: 1, errors: [new Error("Sync failed")] });
    const { result } = renderHook(() => useOfflineSupport({ teacherId: 't1' }));

    await act(async () => {
      await result.current.syncTeacher();
    });

    expect(mockInvalidateTeacher).not.toHaveBeenCalled();
  });

  it('should attempt initial sync on load if online and autoSync is true', async () => {
    mockIsOnline.mockReturnValue(true); // Ensure it's online from the start
    mockSyncTeacherData.mockResolvedValue({ status: syncManager.SyncStatus.SUCCESS, syncedCount: 1, failedCount: 0, errors: [] });

    renderHook(() => useOfflineSupport({ teacherId: 't1', enabled: true, config: { autoSync: true } }));

    // Wait for the useEffect's async logic to complete
    await expect(mockSyncTeacherData).toHaveBeenCalled();

    expect(mockInvalidateTeacher).toHaveBeenCalled();
    expect(mockInvalidateAssessment).toHaveBeenCalled();
    expect(mockInvalidateAttendance).toHaveBeenCalled();
  });

  it('should not attempt initial sync on load if offline', () => {
    mockIsOnline.mockReturnValue(false); // Start offline
    renderHook(() => useOfflineSupport({ teacherId: 't1', enabled: true, config: { autoSync: true } }));
    expect(mockSyncTeacherData).not.toHaveBeenCalled();
  });
});
