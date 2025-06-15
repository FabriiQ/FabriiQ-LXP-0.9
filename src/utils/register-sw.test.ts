import { registerSpecificServiceWorker } from './register-sw';

describe('registerSpecificServiceWorker', () => {
  const mockRegister = jest.fn();
  const mockAddEventListener = jest.fn((event, cb) => {
    if (event === 'load') {
      // Simulate a slight delay or async nature of load event if needed,
      // but for most tests, immediate call is fine.
      cb();
    }
  });
  const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  // const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {}); // Use if specific error logs are checked

  let originalNavigator: Navigator;
  let originalWindow: Window & typeof globalThis;

  beforeEach(() => {
    // Backup original globals
    originalNavigator = global.navigator;
    originalWindow = global.window;

    // Mock navigator and window for service worker registration
    // @ts-ignore
    global.navigator = {
      serviceWorker: {
        register: mockRegister,
      },
    } as any;

    // @ts-ignore
    global.window = {
      addEventListener: mockAddEventListener,
      // Add other window properties if your function uses them
    } as any;

    // Clear mocks before each test
    mockRegister.mockClear();
    mockAddEventListener.mockClear();
    mockConsoleLog.mockClear();
    // mockConsoleError.mockClear();
  });

  afterEach(() => {
    // Restore original globals
    global.navigator = originalNavigator;
    global.window = originalWindow;

    // Restore console spies
    mockConsoleLog.mockRestore();
    // mockConsoleError.mockRestore();
  });

  it('should not attempt to register if serviceWorker is not in navigator', () => {
    // @ts-ignore
    global.navigator = { serviceWorker: undefined } as any; // Simulate no SW support
    registerSpecificServiceWorker('/test-sw.js');
    expect(mockAddEventListener).not.toHaveBeenCalled();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('should add a "load" event listener to window if serviceWorker is supported', () => {
    registerSpecificServiceWorker('/test-sw.js');
    expect(mockAddEventListener).toHaveBeenCalledWith('load', expect.any(Function));
  });

  it('should call navigator.serviceWorker.register with the provided path on window load', () => {
    const swPath = '/my-custom-sw.js';
    registerSpecificServiceWorker(swPath);
    // mockAddEventListener immediately calls the load callback in this test setup
    expect(mockRegister).toHaveBeenCalledWith(swPath);
  });

  it('should log success on registration', async () => {
    const swPath = '/success-sw.js';
    const mockRegistrationObject = { scope: swPath }; // Example registration object
    mockRegister.mockResolvedValueOnce(mockRegistrationObject);

    registerSpecificServiceWorker(swPath);

    // Wait for promises from then/catch in registerSpecificServiceWorker to resolve
    // A microtask tick should be enough if the cb is called synchronously.
    await Promise.resolve();

    expect(mockConsoleLog).toHaveBeenCalledWith(`Service Worker ${swPath} registered: `, mockRegistrationObject);
  });

  it('should log an error on registration failure', async () => {
    const swPath = '/fail-sw.js';
    const registrationError = new Error('Registration failed test');
    mockRegister.mockRejectedValueOnce(registrationError);

    registerSpecificServiceWorker(swPath);

    // Wait for promises from then/catch in registerSpecificServiceWorker to resolve
    await Promise.resolve().catch(() => {}); // Catch expected rejection

    expect(mockConsoleLog).toHaveBeenCalledWith(`Service Worker ${swPath} registration failed: `, registrationError);
  });

  it('should not register if window is undefined (simulating SSR)', () => {
     const originalWin = global.window;
     // @ts-ignore
     delete global.window; // Simulate SSR environment where window is not defined

     registerSpecificServiceWorker('/test-sw.js');
     // Since addEventListener is on window, it shouldn't be called if window is undefined.
     // Our mockAddEventListener is attached to a mocked global.window, so this test needs
     // to ensure the function itself guards against window being undefined.
     // The function `registerSpecificServiceWorker` has `if (typeof window !== 'undefined' ...)`
     expect(mockAddEventListener).not.toHaveBeenCalled(); // This check is indirect.
                                                        // The real check is that no error occurs.
     expect(mockRegister).not.toHaveBeenCalled();

     global.window = originalWin; // Restore window
  });
});
