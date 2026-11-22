import type { ExtractionResult, SourceInput } from "../types";

export interface AdapterContext {
  /** The visitor has explicitly agreed to let SkillProof read this source. */
  consent: boolean;
  /** Only set when the visitor enabled their own AI proxy and consented to it. */
  aiEndpoint?: string;
  signal?: AbortSignal;
  onProgress: (stage: string, percent: number) => void;
}

/**
 * A source adapter turns one kind of input into candidates. To add a provider, implement
 * this interface, add it to ADAPTERS in adapters/index.ts, and it appears in the pipeline.
 */
export interface SourceAdapter {
  id: string;
  label: string;
  handles: SourceInput["type"][];
  run: (input: SourceInput, ctx: AdapterContext) => Promise<ExtractionResult>;
}
