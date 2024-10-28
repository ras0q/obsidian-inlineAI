import { ButtonComponent, setIcon, App, Notice, MarkdownView } from "obsidian";
import { callApi } from "src/api";

export class diffEditorWidget {
	dom: HTMLDivElement;
	acceptButton: ButtonComponent;
	discardButton: ButtonComponent;
	reloadButton: ButtonComponent;
	loader: HTMLDivElement;
	selectedText: string;
	promtText: string;
	generated_text: string;
	app: App;

	constructor(
		app: App,
		selectedText: string,
		generated_text: string,
		promtText: string
	) {
		this.app = app;
		console.log("diffEditorWidget constructor");
		this.selectedText = selectedText;
		this.generated_text = generated_text;
		this.promtText = promtText;

		this.dom = document.createElement("div");
		this.dom.className = "cm-tooltip";
		setIcon(this.dom, "pencil");
		this.acceptButton = new ButtonComponent(this.dom);
		this.acceptButton.buttonEl.classList.add("accept-button");
		this.acceptButton.buttonEl.classList.add("tooltip-button");
		this.acceptButton.setButtonText("Accept");
		this.acceptButton.setTooltip("Accept");
		this.acceptButton.onClick(() => this.submitAction());

		this.discardButton = new ButtonComponent(this.dom);
		this.discardButton.buttonEl.classList.add("discard-button");
		this.discardButton.buttonEl.classList.add("tooltip-button");
		this.discardButton.setButtonText("Discard");
		// setIcon(this.discardButton.buttonEl, "cross");
		this.discardButton.setTooltip("Discard");
		this.discardButton.onClick(() => this.destroy());

		this.reloadButton = new ButtonComponent(this.dom);
		this.reloadButton.buttonEl.classList.add("submit-button");
		setIcon(this.reloadButton.buttonEl, "rotate-cw");
		this.reloadButton.onClick(() => this.submitAction());

		this.loader = document.createElement("div");
		this.loader.className = "loader";
		this.loader.style.display = "none";
		this.dom.appendChild(this.loader);
	}

	async submitAction() {
		console.log("Selected Text:", this.selectedText);

		this.reloadButton.setDisabled(true);
		this.reloadButton.buttonEl.style.display = "none";
		this.loader.style.display = "block";
		try {
			const response = await callApi(this.promtText, this.selectedText);
			new Notice("Response received and replacing selected text.");

			const markdownView =
				this.app.workspace.getActiveViewOfType(MarkdownView);
			if (markdownView) {
				const editor = markdownView.editor;
				editor.replaceSelection(response);
			} else {
				new Notice("Failed to find the active Markdown editor.");
			}
		} catch (error) {
			new Notice("Error: " + (error as Error).message);
		} finally {
			this.reloadButton.setDisabled(false);
			this.reloadButton.buttonEl.style.display = "block";
			this.loader.style.display = "none";
		}
	}

	reload() {}

	destroy() {
		console.log("diffEditorWidget destroy");
		this.dom.remove();
	}

	mount() {
		console.log("diffEditorWidget mount");
		// document.body.appendChild(this.dom);
	}
}
