// api.ts
import { InlineAISettings } from "./settings";
import { App, MarkdownView, Notice } from "obsidian";
import { EditorView } from "@codemirror/view";
import { setGeneratedResponseEffect } from "./modules/AIExtension";
import { parseCommand } from "./modules/commands/parser";
import { MessageQueue } from "./modules/messageHistory/queue";
import { IAIProvidersService } from "@obsidian-ai-providers/sdk";

const MESSAGE_HISTORY_LIMIT = 20;

export type HistoryMessage = {
  mode: string;
  userPrompt: string;
};

/**
 * Class to manage interactions with different chat APIs.
 */
export class ChatApiManager {
  private app: App;
  private chatClient: IAIProvidersService;
  private settings: InlineAISettings;
  private messageHistory: MessageQueue<HistoryMessage>;
  /**
   * Initializes the ChatApiManager with the given settings.
   * @param settings - Configuration settings for the chat API.
   * @param app - The Obsidian App instance.
   */
  constructor(settings: InlineAISettings, app: App, chatClient: IAIProvidersService) {
    this.app = app;
	this.chatClient = chatClient;
    this.settings = settings;
    this.messageHistory = new MessageQueue<HistoryMessage>(MESSAGE_HISTORY_LIMIT);
	this.updateSettings(settings);
  }

  /**
   * Calls the chat API with the provided content and context.
   * @param systemMessage - The system message to send to the chat API.
   * @param message - The user's message to send to the chat API.
   * @returns A promise that resolves with the generated content or an error message.
   */
  public async callApi(systemMessage: string, message: string): Promise<string> {
    if (!this.chatClient) {
      new Notice("⚠️ Chat client is not initialized. Please check your settings.");
      return "⚠️ Chat client is not available.";
    }

    try {
      const fullText = await this.chatClient.execute({
		provider: this.chatClient.providers[0],
		messages: [
			{ role: "system", content: systemMessage },
			{ role: "user", content: message }
		],
		onProgress: () => {},
	  });
	  console.log(fullText)
      return fullText;
    } catch (error: any) {
      console.error("Error calling the chat model:", error);
      new Notice(`❌ Error calling the chat model: ${error.message}`);
      return "⚠️ Failed to generate a response. Please try again later.";
    }
  }

  /**
   * Handles user input and updates the editor with the response.
   * @param systemPrompt - The system prompt to send to the chat API.
   * @param userRequest - The user's request to process.
   * @returns The AI-generated response or an error message.
   */
  private async handleEditorUpdate(systemPrompt: string, userRequest: string): Promise<string> {
    try {
      const response = await this.callApi(systemPrompt, userRequest);
      if (!response) return "⚠️ No response generated.";

      const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!markdownView) {
        new Notice("⚠️ No active Markdown editor found.");
        return "";
      }

      const mainEditorView = (markdownView.editor as any).cm as EditorView;
      mainEditorView?.dispatch({
        effects: setGeneratedResponseEffect.of({ airesponse: response, prompt: userRequest }),
      });

      return response;
    } catch (error: any) {
      console.error("Error processing request:", error);
      new Notice(`❌ Error processing request: ${error.message}`);
      return "⚠️ Failed to process request.";
    }
  }
 /**
   * Processes selected text using the specified prompt and transformation.
   * @param userPrompt - The transformation prompt (e.g., "Add Emojis").
   * @param selectedText - The selected text to transform.
   * @returns The transformed text or an error message.
   */
  public async callSelection(userPrompt: string, selectedText: string): Promise<string> {
    userPrompt = parseCommand(userPrompt, this.settings.commandPrefix, this.settings.customCommands);

    let isCursor = false;
    if (selectedText.trim().length === 0) {
      isCursor = true;
    }

    const systemPrompt = isCursor ? this.settings.cursorPrompt : this.settings.selectionPrompt;
    let finalUserPrompt = ``;
    const mode = isCursor ? "cursor" : "selection";
    if (this.settings.messageHistory) {
      this.messageHistory.enqueue({ mode, userPrompt });
    }

    if (isCursor) {
      finalUserPrompt = `
      **Task:** ${userPrompt}
      **Output:**`;
    } else {
      finalUserPrompt = `
      **Task:** ${userPrompt}
      **Input:**
      ${selectedText}

      **Output:**`;
    }
    return this.handleEditorUpdate(systemPrompt, finalUserPrompt);
  }

  /**
   * Updates the manager's settings and reinitializes the chat client.
   * @param settings - New configuration settings for the chat API.
   */
  public updateSettings(settings: InlineAISettings): void {
    this.settings = settings;

    if (settings.messageHistory) {
	  this.messageHistory = new MessageQueue<HistoryMessage>(MESSAGE_HISTORY_LIMIT);
	} else {
	  this.messageHistory = new MessageQueue<HistoryMessage>(0);
	}
  }

  public getMessageHistory(): HistoryMessage[] {
    return this.messageHistory.getItems();
  }
}
