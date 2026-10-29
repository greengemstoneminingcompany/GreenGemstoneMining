export interface CreativeStudioDraft {
  blocks: Array<Record<string, unknown>>;
  designTokens?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CreativeStudioAdapter {
  panel: HTMLElement;
  root: HTMLElement;
  getDraft(): CreativeStudioDraft;
  saveHistory(): void;
  applyChange(message?: string): void;
  say(message: string): void;
  getSelected(): HTMLElement | null;
  aiWrite?: (input: { mode: string; tone: string; text: string }) => Promise<string | undefined>;
}

export function mountCreativeStudio(api: CreativeStudioAdapter): () => void;
