import { Plugin, MarkdownView } from "obsidian";
import {
	cursorTooltipExtension,
	showTooltipEffect,
} from "./modules/tooltipExtension";
import { EditorView } from "@codemirror/view";
import { conflictMarkers } from "./modules/diffExtension";

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings = DEFAULT_SETTINGS;

	async onload() {
		await this.loadSettings();

		// Register the cursor tooltip extension
		this.registerEditorExtension(cursorTooltipExtension());
		this.registerEditorExtension(conflictMarkers());

		// Add command to show tooltip
		this.addCommand({
			id: "show-cursor-tooltip",
			name: "Show Cursor Tooltip",
			callback: () => {
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// Dispatch the effect to show the tooltip
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					((markdownView.editor as any).cm as EditorView).dispatch({
						effects: showTooltipEffect.of(null),
					});
				}
			},
			hotkeys: [
				{
					modifiers: ["Mod"], // "Mod" stands for "Ctrl" on Windows/Linux and "Cmd" on macOS
					key: "a", // You can change this key to your preference
				},
			],
		});
	}

	onunload() {
		// Cleanup if necessary
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
