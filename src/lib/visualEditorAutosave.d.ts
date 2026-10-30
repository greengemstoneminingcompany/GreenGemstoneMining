export interface ServerAutosaveState {
  id: string | null;
  version: number;
  status: 'draft' | 'published' | 'archived';
}
export interface ServerAutosaveApi {
  getSession(): Promise<{ isAdmin: boolean } | null>;
  saveDraft(input: {
    id: string | null;
    expectedVersion: number;
    name: string;
    payload: Record<string, unknown>;
  }): Promise<{ id: string; version: number; status: 'draft' | 'published' | 'archived' } | null>;
}
export interface ServerAutosaveControllerOptions {
  delay?: number;
  getApi(): ServerAutosaveApi | null | undefined;
  getDraft(): Record<string, unknown>;
  getState(): ServerAutosaveState;
  setId(id: string): void;
  setVersion(version: number): void;
  setStatus(status: ServerAutosaveState['status']): void;
  getName(): string;
  isDirty(): boolean;
  setDirty(value: boolean): void;
  isConflict(): boolean;
  setConflict(value: boolean): void;
  copySnapshot(value: Record<string, unknown>): Record<string, unknown>;
  persistServerState(): void;
  say(message: string): void;
}
export interface ServerAutosaveController {
  schedule(): void;
  cancel(): void;
  isInFlight(): boolean;
  run(): Promise<void>;
  dispose(): void;
}
export function createServerAutosaveController(options: ServerAutosaveControllerOptions): ServerAutosaveController;
