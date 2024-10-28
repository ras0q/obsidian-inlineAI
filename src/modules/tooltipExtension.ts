import { StateField, EditorState, StateEffect } from "@codemirror/state";
import { EditorView, showTooltip, type Tooltip } from "@codemirror/view";
import { TooltipWidget } from "../components/tooltipWidget";
import { App, MarkdownView } from "obsidian";
import { showDiffEditorEffect } from "./diffEditorExtension";

export const showTooltipEffect = StateEffect.define<null>();

export function cursorTooltipExtension(app: App) {
	return StateField.define<Tooltip | null>({
		create() {
			return null;
		},
		update(tooltip, tr) {
			// Check if the transaction contains an effect to show the tooltip
			if (tr.effects.some((e) => e.is(showTooltipEffect))) {
				return getCursorTooltip(tr.state, app);
			}
			if (tr.docChanged || tr.selection) {
				return null;
			}
			return tooltip;
		},
		provide: (field) => showTooltip.from(field),
	});
}

function getCursorTooltip(state: EditorState, app: App): Tooltip | null {
	const { selection } = state;
	const mainSelection = selection.main;
	const { from, to, head, anchor } = mainSelection;
	const currentLine = state.doc.lineAt(from);
	const isSelectionActive = !mainSelection.empty;

	let posAt = currentLine.from;
	let above = true;
	let selectedText = "";

	if (isSelectionActive) {
		selectedText = state.doc.sliceString(from, to);

		if (head > anchor) {
			console.log("Putting tooltip below");
			const endLine = state.doc.lineAt(to);

			if (endLine.number < state.doc.lines) {
				const nextLine = state.doc.line(endLine.number + 1);
				posAt = nextLine.from;
			} else {
				posAt = state.doc.length;
			}
			above = false;
		} else if (head < anchor) {
			console.log("Putting tooltip above");
			const startLine = state.doc.lineAt(from);
			posAt = startLine.from;
			above = true;
		} else {
			posAt = currentLine.from;
			above = true;
		}
	} else {
		posAt = currentLine.from;
		above = true;
	}

	const tooltipWidget = new TooltipWidget(app, selectedText);

	return {
		pos: posAt,
		above,
		arrow: true,
		create: () => ({
			dom: tooltipWidget.dom,
			destroy: () => {
				const markdownView =
					app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					setTimeout(() => {
						(
							(markdownView.editor as any).cm as EditorView
						).dispatch({
							effects: showDiffEditorEffect.of({
								posAt: posAt,
								selectedText: selectedText,
								generatedText: tooltipWidget.generatedText,
								promptText: tooltipWidget.promptText,
							}),
						});
					}, 0);
				}
				tooltipWidget.destroy();
			},
			mount: () => tooltipWidget.mount(),
		}),
	};
}
