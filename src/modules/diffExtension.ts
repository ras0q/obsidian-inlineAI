// src/conflictMarkers.ts

import {
	Decoration,
	DecorationSet,
	EditorView,
	ViewPlugin,
	ViewUpdate,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";

/**
 * Regular expressions to match conflict markers.
 *
 * - Current Conflict: [- ... -]
 * - Incoming Conflict: {+ ... +}
 * - Selected for InlineAI: <<InlineAI<< ... >>InlineAI>>
 */
const CURRENT_CONFLICT_REGEX = /\[-([\s\S]*?)-\]/g;
const INCOMING_CONFLICT_REGEX = /\{\+([\s\S]*?)\+\}/g;
const INLINE_AI_CONFLICT_REGEX = /<<InlineAI<<([\s\S]*?)>>InlineAI>>/g; // Added regex for InlineAI

/**
 * Define decorations with corresponding CSS classes.
 */
const currentConflictDecoration = Decoration.mark({
	class: "cm-conflict-current",
});

const incomingConflictDecoration = Decoration.mark({
	class: "cm-conflict-incoming",
});

const selectedForInlineAIDecoration = Decoration.mark({
	// Renamed for clarity
	class: "cm-selected-inline",
});

// Decoration to hide conflict markers
const hideDecoration = Decoration.replace({
	// This decoration replaces the matched text with nothing, effectively hiding it
	// The `inclusive: false` ensures it doesn't affect surrounding text
	inclusive: false,
});

/**
 * ViewPlugin to detect and decorate conflict markers, including InlineAI markers.
 */
const conflictMarkersPlugin = ViewPlugin.fromClass(
	class {
		decorations: DecorationSet;

		constructor(view: EditorView) {
			this.decorations = this.buildDecorations(view);
		}

		update(update: ViewUpdate) {
			if (update.docChanged || update.viewportChanged) {
				this.decorations = this.buildDecorations(update.view);
			}
		}

		buildDecorations(view: EditorView): DecorationSet {
			const builder = new RangeSetBuilder<Decoration>();
			const text = view.state.doc.toString();

			// Array to hold all decorations to be added
			type DecorationEntry = {
				from: number;
				to: number;
				decoration: Decoration;
			};

			const decorationsToAdd: DecorationEntry[] = [];

			let match: RegExpExecArray | null;

			// Helper function to collect decorations
			const collectConflict = (
				match: RegExpExecArray,
				prefixLength: number,
				suffixLength: number,
				decoration: Decoration
			) => {
				const start = match.index;
				const end = match.index + match[0].length;
				const innerStart = start + prefixLength;
				const innerEnd = end - suffixLength;

				// Add decoration to highlight the inner content
				decorationsToAdd.push({
					from: innerStart,
					to: innerEnd,
					decoration,
				});

				// Add decorations to hide the prefix and suffix
				decorationsToAdd.push({
					from: start,
					to: start + prefixLength,
					decoration: hideDecoration,
				});
				decorationsToAdd.push({
					from: end - suffixLength,
					to: end,
					decoration: hideDecoration,
				});
			};

			// Match Current Conflicts
			while ((match = CURRENT_CONFLICT_REGEX.exec(text)) !== null) {
				collectConflict(match, 0, 0, currentConflictDecoration); // '[-' and '-]'
			}

			// Match Incoming Conflicts
			while ((match = INCOMING_CONFLICT_REGEX.exec(text)) !== null) {
				collectConflict(match, 0, 0, incomingConflictDecoration); // '{+' and '+}'
			}

			// Match InlineAI Conflicts
			while ((match = INLINE_AI_CONFLICT_REGEX.exec(text)) !== null) {
				// collectConflict(match, 12, 12, selectedForInlineAIDecoration); // '<<InlineAI<<' and '>>InlineAI>>'
				collectConflict(match, 0, 0, selectedForInlineAIDecoration); // '<<InlineAI<<' and '>>InlineAI>>'
			}

			// Sort all decorations by 'from' position and 'startSide'
			decorationsToAdd.sort((a, b) => {
				if (a.from !== b.from) {
					return a.from - b.from;
				}
				// Optional: Define startSide if necessary. Codemirror's RangeSetBuilder handles this internally.
				return 0;
			});

			// Check for overlapping decorations and handle accordingly
			let lastAddedTo = -1;
			for (const deco of decorationsToAdd) {
				if (deco.from < lastAddedTo) {
					continue; // Skip overlapping decorations to prevent errors
				}
				builder.add(deco.from, deco.to, deco.decoration);
				if (deco.to > lastAddedTo) {
					lastAddedTo = deco.to;
				}
			}

			return builder.finish();
		}
	},
	{
		decorations: (v) => v.decorations,
	}
);

/**
 * Export the conflictMarkers extension.
 */
export function conflictMarkers() {
	return conflictMarkersPlugin;
}
