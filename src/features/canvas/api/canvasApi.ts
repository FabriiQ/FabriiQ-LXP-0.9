import { CanvasState } from "../state/types";

// Local storage keys
const CANVAS_STATE_KEY_PREFIX = 'canvas_state_';
const CANVAS_LIST_KEY = 'canvas_list';

/**
 * Canvas API service for syncing canvas state with the server
 *
 * Note: This is a client-side implementation using localStorage
 * In a real application, this would use the tRPC client to communicate with the server
 */
export class CanvasApiService {
  /**
   * Get canvas state from local storage
   */
  static async getCanvasState(canvasId: string): Promise<CanvasState | null> {
    try {
      if (typeof window === 'undefined') return null;

      const stateJson = localStorage.getItem(`${CANVAS_STATE_KEY_PREFIX}${canvasId}`);
      if (!stateJson) return null;

      return JSON.parse(stateJson) as CanvasState;
    } catch (error) {
      console.error("Failed to get canvas state from storage:", error);
      return null;
    }
  }

  /**
   * Save canvas state to local storage
   */
  static async saveCanvasState(state: CanvasState): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;

      // Save the state
      localStorage.setItem(
        `${CANVAS_STATE_KEY_PREFIX}${state.canvasId}`,
        JSON.stringify(state)
      );

      // Update the canvas list
      const canvasList = await this.listCanvases();
      const existingIndex = canvasList.findIndex(c => c.canvasId === state.canvasId);

      if (existingIndex >= 0) {
        canvasList[existingIndex].updatedAt = new Date();
      } else {
        canvasList.push({
          canvasId: state.canvasId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      localStorage.setItem(CANVAS_LIST_KEY, JSON.stringify(canvasList));
      return true;
    } catch (error) {
      console.error("Failed to save canvas state to storage:", error);
      return false;
    }
  }

  /**
   * Delete canvas from local storage
   */
  static async deleteCanvas(canvasId: string): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;

      // Remove the state
      localStorage.removeItem(`${CANVAS_STATE_KEY_PREFIX}${canvasId}`);

      // Update the canvas list
      const canvasList = await this.listCanvases();
      const updatedList = canvasList.filter(c => c.canvasId !== canvasId);
      localStorage.setItem(CANVAS_LIST_KEY, JSON.stringify(updatedList));

      return true;
    } catch (error) {
      console.error("Failed to delete canvas from storage:", error);
      return false;
    }
  }

  /**
   * List all canvases from local storage
   */
  static async listCanvases(): Promise<{ canvasId: string; updatedAt: Date; createdAt: Date }[]> {
    try {
      if (typeof window === 'undefined') return [];

      const listJson = localStorage.getItem(CANVAS_LIST_KEY);
      if (!listJson) return [];

      const list = JSON.parse(listJson);

      // Convert string dates to Date objects
      return list.map((item: any) => ({
        canvasId: item.canvasId,
        updatedAt: new Date(item.updatedAt),
        createdAt: new Date(item.createdAt)
      }));
    } catch (error) {
      console.error("Failed to list canvases from storage:", error);
      return [];
    }
  }
}
