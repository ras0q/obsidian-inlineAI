// TooltipWidget.ts
import { EditorView, placeholder, keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { ButtonComponent, setIcon, Notice } from "obsidian";
import { callApi } from "../api";

export class TooltipWidget {
	dom: HTMLDivElement;
	editorView: EditorView;
	submitButton: ButtonComponent;
	loader: HTMLDivElement;
	selectedText: string; // Add property to store selected text

	constructor(selectedText: string) {
		// Accept selectedText as a parameter
		this.selectedText = selectedText;

		this.dom = document.createElement("div");
		this.dom.className = "cm-tooltip";
		setIcon(this.dom, "pencil");

		const editorDom = document.createElement("div");
		editorDom.className = "cm-tooltip-editor";
		this.dom.appendChild(editorDom);

		this.editorView = new EditorView({
			state: EditorState.create({
				doc: "",
				extensions: [
					placeholder("Ask copilot"),
					keymap.of([
						{
							key: "Enter",
							run: () => {
								this.submitAction();
								return true;
							},
							preventDefault: true,
						},
					]),
				],
			}),
			parent: editorDom,
			dispatch: (tr) => this.editorView.update([tr]),
		});

		this.submitButton = new ButtonComponent(this.dom);
		this.submitButton.buttonEl.classList.add("submit-button");
		setIcon(this.submitButton.buttonEl, "send-horizontal");
		this.submitButton.onClick(() => this.submitAction());

		this.loader = document.createElement("div");
		this.loader.className = "loader";
		this.loader.style.display = "none";
		this.dom.appendChild(this.loader);

		this.editorView.requestMeasure({
			read: () => {
				this.editorView.dom.style.height = "100%";
				this.editorView.dom.style.width = "100%";
			},
		});
	}

	async submitAction() {
		const userInput = this.editorView.state.doc.toString();

		// Log the selected text from the main editor
		console.log("Selected Text:", this.selectedText);

		this.submitButton.setDisabled(true);
		this.submitButton.buttonEl.style.display = "none";
		this.loader.style.display = "block";

		try {
			const response = await callApi(userInput);
			new Notice(response);
		} catch (error) {
			new Notice("Error: " + (error as Error).message);
		} finally {
			this.submitButton.setDisabled(false);
			this.submitButton.buttonEl.style.display = "block";
			this.loader.style.display = "none";
		}
	}

	destroy() {
		this.editorView.destroy();
	}

	mount() {
		setTimeout(() => {
			this.editorView.focus();
		}, 0);
	}
}
