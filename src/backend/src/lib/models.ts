export type MessageRole = 'system' | 'user' | 'assistant';

export interface Message {
  role: MessageRole;
  content: string;
}

export type ChatResponseMessage = Message & {
  context?: Record<string, any> & {
    data_points?: string[];
    thoughts?: string;
  };
  session_state?: Record<string, any>;
};

export interface ChatResponse {
  choices: Array<{
    index: number;
    message: ChatResponseMessage;
  }>;
  object: 'chat.completion';
}

export interface ChatResponseChunk {
  choices: Array<{
    index: number;
    delta: Partial<ChatResponseMessage>;
    finish_reason: string | null;
  }>;
  object: 'chat.completion.chunk';
}
