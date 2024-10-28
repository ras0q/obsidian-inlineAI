import { EditorState, StateEffect, StateField } from "@codemirror/state";
import { showTooltip, type Tooltip } from "@codemirror/view";
import { App } from "obsidian";
import { diffEditorWidget } from "src/components/diffEditorWidget";

interface DiffEditorEffectValue {
	posAt: number;
	selectedText: string;
	generatedText: string;
	promptText: string;
}

export const showDiffEditorEffect = StateEffect.define<DiffEditorEffectValue>();

export function showDiffEditorExtension(app: App) {
	return StateField.define<Tooltip | null>({
		create() {
			return null;
		},
		update(tooltip, tr) {
			// Check if the transaction contains an effect to show the tooltip
			if (tr.effects.some((e) => e.is(showDiffEditorEffect))) {
				const effectValue = tr.effects.find((e) =>
					e.is(showDiffEditorEffect)
				)?.value;
				if (effectValue) {
					return getDiffEditorTooltip(
						app,
						effectValue.posAt,
						effectValue.selectedText,
						effectValue.generatedText,
						effectValue.promptText
					);
				}
			}
			if (tr.docChanged || tr.selection) {
				return null;
			}
			return tooltip;
		},
		provide: (field) => showTooltip.from(field),
	});
}

/**
 * Generates a tooltip for the diff editor based on the current selection state.
 *
 * @param state - The current state of the editor.
 * @param app - The application instance.
 * @returns A Tooltip object if a selection is active, otherwise null.
 */
function getDiffEditorTooltip(
	app: App,
	posAt: number,
	selectedText: string,
	generated_text: string,
	promptText: string
): Tooltip | null {
	console.log("getDiffEditorTooltip");
	console.log("Selected text: ", selectedText);
	console.log("Position at: ", posAt);

	const tooltipWidget = new diffEditorWidget(
		app,
		selectedText,
		generated_text,
		promptText
	);

	return {
		pos: posAt,
		arrow: true,
		above: true,
		create: () => ({
			dom: tooltipWidget.dom,
			destroy: () => tooltipWidget.destroy(),
			mount: () => tooltipWidget.mount(),
		}),
	};
}
