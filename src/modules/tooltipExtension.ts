import {
	StateField,
	EditorState,
	StateEffect,
	Transaction,
} from "@codemirror/state";
import { EditorView, showTooltip, type Tooltip } from "@codemirror/view";
import { TooltipWidget } from "../components/tooltipWidget";
import { App, MarkdownView } from "obsidian";

export const showTooltipEffect = StateEffect.define<null>();
export const dismissTooltipEffect = StateEffect.define<null>();

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
			// Check if the transaction contains an effect to dismiss the tooltip
			if (tr.effects.some((e) => e.is(dismissTooltipEffect))) {
				return null;
			}
			// Keep the tooltip if it's already visible
			if (tooltip && !shouldDismissTooltip(tr)) {
				return tooltip;
			}
			return null;
		},
		provide: (field) => showTooltip.from(field),
	});
}

function shouldDismissTooltip(tr: Transaction): boolean {
	// Dismiss the tooltip if the user presses Escape
	if (tr.selection) {
		const { main } = tr.selection;
		if (main.empty && tr.docChanged) {
			return false; // Keep the tooltip open on document changes
		}
	}
	// Add any additional conditions for dismissing the tooltip here
	return false;
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
		create: (view: EditorView) => {
			const dom = tooltipWidget.dom;

			// Add the event listener
			const onClick = (event: MouseEvent) => {
				if (!dom.contains(event.target as Node)) {
					// Clicked outside the tooltip
					view.dispatch({
						effects: dismissTooltipEffect.of(null),
					});
				}
			};

			dom.addEventListener("mousedown", (event: MouseEvent) => {
				event.stopPropagation(); // Prevent the event from propagating to the document
			});

			document.addEventListener("mousedown", (event: MouseEvent) => {
				if (!dom.contains(event.target as Node)) {
					// Clicked outside the tooltip
					view.dispatch({
						effects: dismissTooltipEffect.of(null),
					});
				}
			});
			const onEscape = (event: KeyboardEvent) => {
				if (event.key === "Escape") {
					view.dispatch({
						effects: dismissTooltipEffect.of(null),
					});
				}
			};
			// listen also for escape key
			document.addEventListener("keydown", onEscape);

			return {
				dom: tooltipWidget.dom,
				destroy: () => {
					// Remove the event listener when the tooltip is destroyed
					document.removeEventListener("mousedown", onClick);
					document.removeEventListener("keydown", onEscape);
					tooltipWidget.destroy();
				},
				mount: () => tooltipWidget.mount(),
			};
		},
	};
}
