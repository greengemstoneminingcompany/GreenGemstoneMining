export interface CreativeStudioDraft {
  blocks: Array<Record<string, unknown>>;
  designTokens?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CreativeStudioServerTemplate {
  id: string;
  name: string;
  block: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreativeStudioAdapter {
  panel: HTMLElement;
  root: HTMLElement;
  getDraft(): CreativeStudioDraft;
  saveHistory(): void;
  applyChange(message?: string): void;
  say(message: string): void;
  getSelected(): HTMLElement | null;
  editorApi?: {
    getSession?: () => Promise<{ email: string | null; isAdmin: boolean }>;
    listTemplates?: () => Promise<CreativeStudioServerTemplate[]>;
    saveTemplate?: (input: { id: string | null; name: string; block: Record<string, unknown> }) => Promise<CreativeStudioServerTemplate>;
    deleteTemplate?: (id: string) => Promise<boolean>;
  };
  aiWrite?: (input: { mode: string; tone: string; text: string }) => Promise<string | undefined>;
}

export function mountCreativeStudio(api: CreativeStudioAdapter): () => void;
