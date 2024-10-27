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
 */
const CURRENT_CONFLICT_REGEX = /\[-[\s\S]*?-\]/g;
const INCOMING_CONFLICT_REGEX = /\{\+[\s\S]*?\+\}/g;

/**
 * Define decorations with corresponding CSS classes.
 */
const currentConflictDecoration = Decoration.mark({
	class: "cm-conflict-current",
});

const incomingConflictDecoration = Decoration.mark({
	class: "cm-conflict-incoming",
});

/**
 * ViewPlugin to detect and decorate conflict markers.
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

			// Collect all matches for current and incoming conflicts
			const conflicts: {
				from: number;
				to: number;
				decoration: Decoration;
			}[] = [];

			let match: RegExpExecArray | null;

			// Match Current Conflicts
			while ((match = CURRENT_CONFLICT_REGEX.exec(text)) !== null) {
				const start = match.index;
				const end = match.index + match[0].length;
				conflicts.push({
					from: start,
					to: end,
					decoration: currentConflictDecoration,
				});
			}

			// Match Incoming Conflicts
			while ((match = INCOMING_CONFLICT_REGEX.exec(text)) !== null) {
				const start = match.index;
				const end = match.index + match[0].length;
				conflicts.push({
					from: start,
					to: end,
					decoration: incomingConflictDecoration,
				});
			}

			// Sort conflicts by start position
			conflicts.sort((a, b) => a.from - b.from);

			// Check for overlapping conflicts and handle accordingly
			for (let i = 0; i < conflicts.length; i++) {
				if (i > 0 && conflicts[i].from < conflicts[i - 1].to) {
					console.warn(
						"Overlapping conflict markers detected. Skipping overlapping decoration."
					);
					continue; // Skip overlapping decorations to prevent errors
				}
				builder.add(
					conflicts[i].from,
					conflicts[i].to,
					conflicts[i].decoration
				);
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
