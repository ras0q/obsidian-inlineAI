// api.ts
import { ChatOpenAI } from "@langchain/openai";
import { ChatOllama } from "@langchain/ollama";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { InlineAISettings } from "./settings";
import { App, MarkdownView, Notice } from "obsidian";
import { EditorView } from "@codemirror/view";
import { setGeneratedResponseEffect } from "./modules/AIExtension";
import { parseCommand } from "./modules/commands/parser";

/**
 * Class to manage interactions with different chat APIs.
 */
export class ChatApiManager {
  private chatClient: ChatOpenAI | ChatOllama | ChatGoogleGenerativeAI | null;
  private app: App;
  private settings: InlineAISettings;

  /**
   * Initializes the ChatApiManager with the given settings.
   * @param settings - Configuration settings for the chat API.
   * @param app - The Obsidian App instance.
   */
  constructor(settings: InlineAISettings, app: App) {
    this.app = app;
    this.chatClient = this.initializeChatClient(settings);
    this.settings = settings;
  }

  /**
   * Initializes the appropriate chat client based on the provider specified in settings.
   * @param settings - Configuration settings for the chat API.
   * @returns An instance of ChatOpenAI, ChatOllama, or null if initialization fails.
   */
  private initializeChatClient(settings: InlineAISettings): ChatOpenAI | ChatOllama | ChatGoogleGenerativeAI | null {
    try {
      switch (settings.provider) {
        case "openai":
          if (!settings.apiKey) {
            new Notice("⚠️ OpenAI API key is required. Please check your settings.");
            return null;
          }
          return new ChatOpenAI({
            modelName: settings.model,
            temperature: 0,
            apiKey: settings.apiKey,
          });

        case "ollama":
          return new ChatOllama({
            model: settings.model,
          });
        case "gemini":
          return new ChatGoogleGenerativeAI({
            model: settings.model,
            apiKey: settings.apiKey,
          });
        case "custom":
          if (!settings.apiKey || !settings.customURL) {
            new Notice("⚠️ API key and custom base URL are required for custom providers.");
            return null;
          }
          return new ChatOpenAI({
            modelName: settings.model,
            temperature: 0,
            openAIApiKey: settings.apiKey,
            // 'configuration.basePath' is the recognized property
            configuration: {
              baseURL: settings.customURL.trim(),
            },
          });

        default:
          new Notice(`⚠️ Unsupported provider: ${settings.provider}`);
          return null;
      }
    } catch (error: any) {
      console.error("Error initializing chat client:", error);
      new Notice(`❌ Error initializing chat client: ${error.message}`);
      return null;
    }
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

    const messages = [
      new SystemMessage(systemMessage),
      new HumanMessage(message),
    ];

    try {
      const aiMessage: AIMessage = await this.chatClient.invoke(messages);
      return aiMessage.content.toString();
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
   * Handles user input and generates a response using the cursor API.
   * @param userRequest - The user's request to process.
   * @returns The AI-generated response or an error message.
   */
  public async callCursor(userRequest: string): Promise<string> {
    const systemPrompt = "You are a helpful assistant. Please help the user with the following request:";
    return this.handleEditorUpdate(systemPrompt, userRequest);
  }

  /**
   * Processes selected text using the specified prompt and transformation.
   * @param prompt - The transformation prompt (e.g., "Add Emojis").
   * @param selectedText - The selected text to transform.
   * @returns The transformed text or an error message.
   */
  public async callSelection(prompt: string, selectedText: string): Promise<string> {
    prompt = parseCommand(prompt, this.settings.commandPrefix, this.settings.customCommands);

    let isCursor = false;
    if (selectedText.trim().length === 0) {
      isCursor = true;
    }

    const systemPrompt = isCursor ? this.settings.cursorPrompt : this.settings.selectionPrompt;
    let userPrompt = ``;

    if (isCursor) {
      userPrompt = `
      **Task:** ${prompt}  
      **Output:**`;
    } else {
      userPrompt = `
      **Task:** ${prompt}  
      **Input:**  
      ${selectedText}

      **Output:**`;
    }
    return this.handleEditorUpdate(systemPrompt, userPrompt);
  }

  /**
   * Updates the manager's settings and reinitializes the chat client.
   * @param settings - New configuration settings for the chat API.
   */
  public updateSettings(settings: InlineAISettings): void {
    this.settings = settings;
    const newChatClient = this.initializeChatClient(settings);
    if (!newChatClient) {
      return;
    }
    this.chatClient = newChatClient;
  }
}
