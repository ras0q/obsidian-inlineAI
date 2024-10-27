// extensions.ts
import { StateField, EditorState } from "@codemirror/state";
import { showTooltip, type Tooltip } from "@codemirror/view";
import { TooltipWidget } from "../components/tooltipWidget";
import { StateEffect } from "@codemirror/state";

export const showTooltipEffect = StateEffect.define<null>();

export function cursorTooltipExtension() {
	return StateField.define<Tooltip | null>({
		create() {
			return null;
		},
		update(tooltip, tr) {
			if (tr.effects.some((e) => e.is(showTooltipEffect))) {
				return getCursorTooltip(tr.state);
			}
			if (tr.docChanged || tr.selection) {
				return null;
			}
			return tooltip;
		},
		provide: (field) => showTooltip.from(field),
	});
}

function getCursorTooltip(state: EditorState): Tooltip | null {
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
				// Get the next line's start position
				const nextLine = state.doc.line(endLine.number + 1);
				posAt = nextLine.from;
			} else {
				// If at the end of the document, place tooltip at the document's end
				posAt = state.doc.length;
			}
			above = false; // Tooltip is below
		} else if (head < anchor) {
			console.log("Putting tooltip above");
			const startLine = state.doc.lineAt(from);
			posAt = startLine.from;
			above = true; // Tooltip is above
		} else {
			// Fallback for any other cases
			posAt = currentLine.from;
			above = true;
		}
	} else {
		// When there's no active selection, place tooltip at the start of the current line
		posAt = currentLine.from;
		above = true;
	}

	const tooltipWidget = new TooltipWidget(selectedText); // Pass selectedText

	return {
		pos: posAt,
		above,
		create: () => ({
			dom: tooltipWidget.dom,
			destroy: () => tooltipWidget.destroy(),
			mount: () => tooltipWidget.mount(),
		}),
	};
}
