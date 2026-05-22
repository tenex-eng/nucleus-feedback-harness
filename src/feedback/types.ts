export type FeedbackSource = 'case_closure' | 'general' | 'targeted';

export type ScreenshotMetadata = {
  storagePath: string;
};

export type FeedbackItem = {
  id: string;
  source: FeedbackSource;
  createdAt: string;
  tenantId?: string;
  userId?: string;
  caseId?: string;
  pageUrl?: string;
  feedbackType?: 'product' | 'ai';
  rating?: number;
  text: string;
  suggestedOutput?: unknown;
  elementContext?: unknown;
  screenshot?: ScreenshotMetadata;
};
