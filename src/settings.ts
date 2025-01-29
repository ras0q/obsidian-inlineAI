import { App, PluginSettingTab, Setting } from "obsidian";
import MyPlugin from "./main";
import { cursorPrompt, selectionPrompt } from "./default_prompts";
import { SlashCommand } from "./modules/commands/source";

// Interface for the settings
export interface InlineAISettings {
	provider: "openai" | "ollama" | "custom";
	model: string;
	apiKey?: string;
	customURL?: string; // Add a custom URL field
	selectionPrompt: string;
	cursorPrompt: string;
	customCommands: SlashCommand[];
	commandPrefix: string; // Add command prefix setting
}

// Default settings values
export const DEFAULT_SETTINGS: InlineAISettings = {
	provider: "ollama",
	model: "llama3.2",
	apiKey: "",
	customURL: "",
	selectionPrompt: selectionPrompt,
	cursorPrompt: cursorPrompt,
	customCommands: [], // Default is an empty array
	commandPrefix: "/" // Default command prefix
};

// Settings tab class to display settings in Obsidian UI
export class InlineAISettingsTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// Provider setting
		new Setting(containerEl)
			.setName("Provider")
			.setDesc("Choose between OpenAI, Ollama, or a custom OpenAI-compatible endpoint.")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("openai", "OpenAI")
					.addOption("ollama", "Ollama")
					.addOption("custom", "Custom/OpenAI-compatible")
					.setValue(this.plugin.settings.provider)
					.onChange(async (value) => {
						this.plugin.settings.provider = value as "openai" | "ollama" | "custom";
						await this.plugin.saveSettings();
						this.plugin.chatapi.updateSettings(this.plugin.settings);
						this.display(); // Refresh to update the API key field visibility
					})
			);

		// Model setting
		new Setting(containerEl)
			.setName("Model")
			.setDesc("Specify the model to use.")
			.addText(text =>
				text
					.setPlaceholder("e.g., gpt-4o-mini")
					.setValue(this.plugin.settings.model)
					.onChange(async (value) => {
						this.plugin.settings.model = value;
						await this.plugin.saveSettings();
						this.plugin.chatapi.updateSettings(this.plugin.settings);
					})
			);

		// API Key setting (conditionally displayed for OpenAI suported endpoints
		if (this.plugin.settings.provider === "openai" || 
			this.plugin.settings.provider === "custom"
		) {
			new Setting(containerEl)
				.setName("API key")
				.setDesc("Enter your API key.")
				.addText((text) =>
					text
						.setPlaceholder("sk-...")
						.setValue(this.plugin.settings.apiKey || "")
						.onChange(async (value) => {
							this.plugin.settings.apiKey = value;
							await this.plugin.saveSettings();
							this.plugin.chatapi.updateSettings(this.plugin.settings);
						})
				);
		}

		/**
		 * If the user chooses 'custom', show a field for the base endpoint URL.
		 */
		if (this.plugin.settings.provider === "custom") {
			new Setting(containerEl)
			.setName("Custom endpoint")
			.setDesc("Enter your OpenAI-compatible base URL (e.g. https://api.groq.com/openai/v1).")
			.addText((text) =>
				text
				.setPlaceholder("https://api.mycustomhost.com/v1")
				.setValue(this.plugin.settings.customURL || "")
				.onChange(async (value) => {
					this.plugin.settings.customURL = value;
					await this.plugin.saveSettings();
					this.plugin.chatapi.updateSettings(this.plugin.settings);
				})
			);
		}

		// Advanced Section
		new Setting(containerEl)
			.setName("Advanced")
			.setHeading();

		// Command Prefix setting
		new Setting(containerEl)
			.setName("Command Prefix")
			.setDesc("The prefix used to trigger custom commands (e.g., /, !, #)")
			.addText((text) =>
				text
					.setPlaceholder("/")
					.setValue(this.plugin.settings.commandPrefix)
					.onChange(async (value) => {
						// Ensure the prefix is a single character
						this.plugin.settings.commandPrefix = value[0];
						await this.plugin.saveSettings();
						this.display();	
					})
			);

		// Selection Prompt setting
		new Setting(containerEl)
			.setName("Selection prompt")
			.setDesc("System Prompt used when the tooltip is triggered with selected text.")
			.addTextArea((textarea) => {
				textarea
					.setPlaceholder("e.g., Summarize the selected text.")
					.setValue(this.plugin.settings.selectionPrompt)
					.onChange(async (value) => {
						this.plugin.settings.selectionPrompt = value;
						await this.plugin.saveSettings();
						this.plugin.chatapi.updateSettings(this.plugin.settings);
					});

				// Add a CSS class for styling
				textarea.inputEl.classList.add("wide-text-settings");
			});

		// Cursor Prompt setting
		new Setting(containerEl)
			.setName("Cursor prompt")
			.setDesc("System Prompt used when the tooltip is triggered with selected text.")
			.addTextArea((textarea) => {
				textarea
					.setPlaceholder("e.g., Generate text based on cursor position.")
					.setValue(this.plugin.settings.cursorPrompt)
					.onChange(async (value) => {
						this.plugin.settings.cursorPrompt = value;
						await this.plugin.saveSettings();
						this.plugin.chatapi.updateSettings(this.plugin.settings);
					});

				// Add a CSS class for styling
				textarea.inputEl.classList.add("wide-text-settings");
			});

		// Custom Commands Section
		containerEl.createEl("h3", { text: "Custom Commands" });
		// Add a description
		containerEl.createEl("p", { text: "Add your own custom commands. Triggered with /" });

		// Display existing commands
		this.plugin.settings.customCommands.forEach((command, index) => {
			const setting = new Setting(containerEl)
				.setName(`Command: ${command.keyword}`)
				.setDesc("Edit the command prompt.")
				.addText((text) =>
					text
						.setValue(command.keyword)
						.setPlaceholder("Command name")
						.onChange(async (value) => {
							this.plugin.settings.customCommands[index].keyword = value;
							await this.plugin.saveSettings();
						})
				)
				.addTextArea((textarea) =>
					textarea
						.setValue(command.prompt)
						.setPlaceholder("Command prompt")
						.onChange(async (value) => {
							this.plugin.settings.customCommands[index].prompt = value;
							await this.plugin.saveSettings();
						})
				)
				.addExtraButton((btn) =>
					btn
						.setIcon("trash")
						.setTooltip("Delete this command")
						.onClick(async () => {
							this.plugin.settings.customCommands.splice(index, 1);
							await this.plugin.saveSettings();
							this.display(); // Refresh the display
						})
				);
		});

		// Add new command button
		new Setting(containerEl)
			.addButton((btn) =>
				btn
					.setButtonText("Add Command")
					.setCta()
					.onClick(async () => {
						this.plugin.settings.customCommands.push({ keyword: "new_command", prompt: "" });
						await this.plugin.saveSettings();
						this.display(); // Refresh the display
					})
			);
	}
}
