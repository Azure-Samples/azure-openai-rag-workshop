import { encoding_for_model, type TiktokenModel } from '@dqbd/tiktoken';
import { type BaseMessage, AIMessage, HumanMessage, SystemMessage } from 'langchain/schema';
import { type Message, type MessageRole } from './models.js';

export class MessageBuilder {
  messages: Message[];
  model: string;
  tokens: number;

  /**
   * A class for building and managing messages in a chat conversation.
   * @param {string} systemContent The initial system message content.
   * @param {string} chatgptModel The name of the ChatGPT model.
   */
  constructor(systemContent: string, chatgptModel: string) {
    this.model = chatgptModel;
    this.messages = [{ role: 'system', content: systemContent }];
    this.tokens = this.getTokenCountFromMessages(this.messages[this.messages.length - 1], this.model);
  }

  /**
   * Append a new message to the conversation.
   * @param {MessageRole} role The role of the message sender.
   * @param {string} content The content of the message.
   * @param {number} index The index at which to insert the message.
   */
  appendMessage(role: MessageRole, content: string, index = 1) {
    this.messages.splice(index, 0, { role, content });
    this.tokens += this.getTokenCountFromMessages(this.messages[index], this.model);
  }

  /**
   * Get the messages in the conversation in LangChain format.
   * @returns {BaseMessage[]} The messages.
   */
  getMessages(): BaseMessage[] {
    return this.messages.map((message) => {
      if (message.role === 'system') {
        return new SystemMessage(message.content);
      } else if (message.role === 'assistant') {
        return new AIMessage(message.content);
      } else {
        return new HumanMessage(message.content);
      }
    });
  }

  /**
   * Calculate the number of tokens required to encode a message.
   * @param {Message} message The message to encode.
   * @param {string} model The name of the model to use for encoding.
   * @returns {number} The total number of tokens required to encode the message.
   * @example
   * const message = { role: 'user', content: 'Hello, how are you?' };
   * const model = 'gpt-3.5-turbo';
   * getTokenCountFromMessages(message, model);
   * // output: 11
   */
  private getTokenCountFromMessages(message: Message, model: string): number {
    // GPT3.5 tiktoken model name is slightly different than Azure OpenAI model name
    const tiktokenModel = model.replace('gpt-35', 'gpt-3.5') as TiktokenModel;
    const encoder = encoding_for_model(tiktokenModel);
    let tokens = 2; // For "role" and "content" keys
    for (const value of Object.values(message)) {
      tokens += encoder.encode(value).length;
    }
    encoder.free();
    return tokens;
  }
}
