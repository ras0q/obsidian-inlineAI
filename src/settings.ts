import { App, PluginSettingTab, Setting } from "obsidian";
import MyPlugin from "./main";
import { cursorPrompt, selectionPrompt } from "./default_prompts";
import { SlashCommand } from "./modules/commands/source";

// Interface for the settings
export interface InlineAISettings {
	selectionPrompt: string;
	cursorPrompt: string;
	customCommands: SlashCommand[];
	commandPrefix: string;
	messageHistory: boolean;
}

// Default settings values
export const DEFAULT_SETTINGS: InlineAISettings = {
	selectionPrompt: selectionPrompt,
	cursorPrompt: cursorPrompt,
	customCommands: [],
	commandPrefix: "/",
	messageHistory: false
};

export class InlineAISettingsTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/** Function to save settings after user finishes editing */
	private async saveSettings() {
		await this.plugin.saveSettings();
		this.plugin.chatapi.updateSettings(this.plugin.settings);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// Advanced Section
		containerEl.createEl("h3", { text: "Advanced" });
		// Selection Prompt setting
		new Setting(containerEl)
			.setName("Selection prompt")
			.setDesc("System Prompt used when the tooltip is triggered with selected text.")
			.addTextArea((textarea) => {
				textarea.setPlaceholder("e.g., Summarize the selected text.")
					.setValue(this.plugin.settings.selectionPrompt)
					.inputEl.addEventListener("blur", async () => {
						this.plugin.settings.selectionPrompt = textarea.getValue();
						await this.saveSettings();
					});
				textarea.inputEl.classList.add("wide-text-settings");
			});

		// Cursor Prompt setting
		new Setting(containerEl)
			.setName("Cursor prompt")
			.setDesc("System Prompt used when the tooltip is triggered with selected text.")
			.addTextArea((textarea) => {
				textarea.setPlaceholder("e.g., Generate text based on cursor position.")
					.setValue(this.plugin.settings.cursorPrompt)
					.inputEl.addEventListener("blur", async () => {
						this.plugin.settings.cursorPrompt = textarea.getValue();
						await this.saveSettings();
					});
				textarea.inputEl.classList.add("wide-text-settings");
			});

		// Message History setting
		new Setting(containerEl)
			.setName("Message History")
			.setDesc("Enable message history, you can navigate through the history using the up/down arrow keys.")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.messageHistory)
					.onChange(async (value) => {
						this.plugin.settings.messageHistory = value;
						await this.saveSettings();
					});
			});

		// Custom Commands Section
		containerEl.createEl("h3", { text: "Custom Commands" });
		containerEl.createEl("p", { text: "Add your own custom commands. Triggered with the prefix defined in the Command Prefix setting." });

		// Command Prefix setting
		new Setting(containerEl)
			.setName("Command Prefix")
			.setDesc("The prefix used to trigger custom commands (e.g., /, !, #)")
			.addText((text) => {
				text.setPlaceholder("/")
					.setValue(this.plugin.settings.commandPrefix)
					.inputEl.addEventListener("blur", async () => {
						this.plugin.settings.commandPrefix = text.getValue().charAt(0);
						await this.saveSettings();
						this.display();
					});
			});

		// Display existing commands
		this.plugin.settings.customCommands.forEach((command, index) => {
			new Setting(containerEl)
				.setName(`Command: ${command.keyword}`)
				.setDesc("Edit the command prompt.")
				.addText((text) => {
					text.setValue(command.keyword)
						.setPlaceholder("Command name")
						.inputEl.addEventListener("blur", async () => {
							this.plugin.settings.customCommands[index].keyword = text.getValue();
							await this.saveSettings();
						});
				})
				.addTextArea((textarea) => {
					textarea.setValue(command.prompt)
						.setPlaceholder("Command prompt")
						.inputEl.addEventListener("blur", async () => {
							this.plugin.settings.customCommands[index].prompt = textarea.getValue();
							await this.saveSettings();
						});
				})
				.addExtraButton((btn) =>
					btn
						.setIcon("trash")
						.setTooltip("Delete this command")
						.onClick(async () => {
							this.plugin.settings.customCommands.splice(index, 1);
							await this.saveSettings();
							this.display();
						})
				);
		});



		// Add new command button
		new Setting(containerEl).addButton((btn) =>
			btn
				.setButtonText("Add Command")
				.setCta()
				.onClick(async () => {
					this.plugin.settings.customCommands.push({ keyword: "new_command", prompt: "" });
					await this.saveSettings();
					this.display();
				})
		);
	}
}
