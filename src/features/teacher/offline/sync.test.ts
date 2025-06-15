import { syncTeacherData, SyncStatus } from './sync';
// To mock isOnline, we need to be careful. If it's exported and not using `navigator.onLine` directly in its definition
// in a way that's hard to mock, this is easier.
// For this test, we will mock `navigator.onLine` directly.
import * as db from './db';
import * as api from './api';
import * as analytics from './analytics';

// Mock dependencies from the same module or other modules
jest.mock('./db');
jest.mock('./api');
jest.mock('./analytics');

const mockNavigatorLocksRequest = jest.fn();
let originalNavigator: Navigator;
let originalNavigatorLocks: typeof navigator.locks | undefined; // It might be undefined if not supported by test env
let originalNavigatorOnLine: typeof navigator.onLine;


describe('syncTeacherData - Web Locks for Concurrency', () => {
  beforeAll(() => {
    originalNavigator = global.navigator;
    // Store original navigator.locks and navigator.onLine
    if (global.navigator) {
        originalNavigatorLocks = global.navigator.locks;
        originalNavigatorOnLine = global.navigator.onLine;
    }
  });

  beforeEach(() => {
    // Ensure navigator object exists and setup mocks
    if (!global.navigator) {
        // @ts-ignore
        global.navigator = {};
    }
    // @ts-ignore
    global.navigator.locks = { request: mockNavigatorLocksRequest };
    // Default to online, tests can override
    Object.defineProperty(global.navigator, 'onLine', {
        value: true,
        configurable: true,
    });

    // Reset mocks for db, api, analytics
    (db.getUnsyncedAttendance as jest.Mock).mockResolvedValue([]);
    (db.getUnsyncedAssessments as jest.Mock).mockResolvedValue([]);
    (api.syncAttendanceToServer as jest.Mock).mockResolvedValue(undefined);
    (api.syncAssessmentToServer as jest.Mock).mockResolvedValue(undefined);
    (db.markAttendanceAsSynced as jest.Mock).mockResolvedValue(undefined);
    (db.markAssessmentAsSynced as jest.Mock).mockResolvedValue(undefined);
    (analytics.trackOfflineSyncStart as jest.Mock).mockImplementation(() => {});
    (analytics.trackOfflineSyncComplete as jest.Mock).mockImplementation(() => {});
    (analytics.trackOfflineSyncError as jest.Mock).mockImplementation(() => {});

    mockNavigatorLocksRequest.mockClear();
  });

  afterAll(() => {
    // Restore original navigator object and its properties
    if (originalNavigator) {
        global.navigator = originalNavigator;
    } else {
        // @ts-ignore
        delete global.navigator;
    }
    // jest.restoreAllMocks(); // This is good, but ensure navigator properties are also restored.
  });
   afterEach(() => {
    // Restore navigator.onLine to its original state or default for other tests
    if (originalNavigator) {
        Object.defineProperty(global.navigator, 'onLine', {
            value: originalNavigatorOnLine,
            configurable: true,
        });
        global.navigator.locks = originalNavigatorLocks!;
    }
    jest.clearAllMocks(); // Clears all mocks, including spies.
  });


  it('should return ERROR if offline by mocking navigator.onLine', async () => {
    Object.defineProperty(global.navigator, 'onLine', {
      value: false,
      configurable: true,
    });

    const result = await syncTeacherData();
    expect(result.status).toBe(SyncStatus.ERROR);
    expect(result.errors[0]?.message).toContain('Cannot sync while offline');
    expect(mockNavigatorLocksRequest).not.toHaveBeenCalled();
  });

  it('should not proceed with sync if lock is not acquired (request returns null)', async () => {
    Object.defineProperty(global.navigator, 'onLine', { value: true, configurable: true });
    mockNavigatorLocksRequest.mockResolvedValue(null); // Simulate lock not granted

    const result = await syncTeacherData();

    expect(mockNavigatorLocksRequest).toHaveBeenCalledWith('teacher_data_sync_lock', { ifAvailable: true }, expect.any(Function));
    expect(db.getUnsyncedAttendance).not.toHaveBeenCalled();
    expect(result.status).toBe(SyncStatus.IDLE);
    expect(result.errors[0]?.message).toContain('Sync lock not acquired');
  });

  it('should proceed with sync if lock is acquired and data exists', async () => {
    Object.defineProperty(global.navigator, 'onLine', { value: true, configurable: true });
    const mockLockObject = { name: 'teacher_data_sync_lock' }; // A truthy value for the lock

    // Simulate lock being granted: the callback passed to `request` is executed.
    // `mockNavigatorLocksRequest` should call the callback it receives.
    mockNavigatorLocksRequest.mockImplementation(async (name, options, callback) => {
      return callback(mockLockObject); // Simulate granting the lock and executing the callback
    });

    (db.getUnsyncedAttendance as jest.Mock).mockResolvedValueOnce([{ id: 'att1', data: { value: 'present'} }] as any);
    (db.getUnsyncedAssessments as jest.Mock).mockResolvedValueOnce([]);

    const result = await syncTeacherData();

    expect(mockNavigatorLocksRequest).toHaveBeenCalledWith('teacher_data_sync_lock', { ifAvailable: true }, expect.any(Function));
    expect(db.getUnsyncedAttendance).toHaveBeenCalledTimes(1);
    expect(api.syncAttendanceToServer).toHaveBeenCalledWith({ id: 'att1', data: { value: 'present' } });
    expect(db.markAttendanceAsSynced).toHaveBeenCalledWith('att1');
    expect(result.status).toBe(SyncStatus.SUCCESS);
    expect(result.syncedCount).toBe(1);
  });

  it('should return SUCCESS with 0 synced if no data to sync even if lock acquired', async () => {
    Object.defineProperty(global.navigator, 'onLine', { value: true, configurable: true });
    const mockLockObject = { name: 'teacher_data_sync_lock' };
    mockNavigatorLocksRequest.mockImplementation(async (name, options, callback) => {
        return callback(mockLockObject);
    });

    // Ensure mocks for getUnsynced... return empty arrays (already default in beforeEach, but explicit here is fine)
    (db.getUnsyncedAttendance as jest.Mock).mockResolvedValueOnce([]);
    (db.getUnsyncedAssessments as jest.Mock).mockResolvedValueOnce([]);

    const result = await syncTeacherData();
    expect(result.status).toBe(SyncStatus.SUCCESS);
    expect(result.syncedCount).toBe(0);
    expect(api.syncAttendanceToServer).not.toHaveBeenCalled();
  });

  it('should handle error during lock request itself', async () => {
    Object.defineProperty(global.navigator, 'onLine', { value: true, configurable: true });
    const lockRequestError = new Error("Failed to request lock");
    mockNavigatorLocksRequest.mockRejectedValue(lockRequestError);

    const result = await syncTeacherData();
    expect(result.status).toBe(SyncStatus.ERROR);
    expect(result.errors[0]).toBe(lockRequestError);
  });

  it('should handle error within the lock callback (e.g., db failure after lock)', async () => {
    Object.defineProperty(global.navigator, 'onLine', { value: true, configurable: true });
    const mockLockObject = { name: 'teacher_data_sync_lock' };
    mockNavigatorLocksRequest.mockImplementation(async (name, options, callback) => {
        return callback(mockLockObject);
    });

    const dbError = new Error("DB read failed");
    (db.getUnsyncedAttendance as jest.Mock).mockRejectedValueOnce(dbError);

    const result = await syncTeacherData();
    expect(result.status).toBe(SyncStatus.ERROR);
    // The error from getUnsyncedAttendance should be caught and tracked.
    // The overall error array in SyncResult might contain it.
    // Depending on how errors are aggregated, it might be a general error or specific one.
    // Current sync.ts implementation would catch this in the main try-catch within the lock.
    expect(result.errors.some(e => e.message === dbError.message)).toBe(true);
    expect(analytics.trackOfflineSyncError).toHaveBeenCalledWith(dbError.message, 'attendance-fetch');
  });
});
