import { diffLines, diffWords, Change } from "diff";

/**
 * Configuration for custom conflict markers.
 */
const CONFLICT_MARKERS = {
	currentStart: "[-",
	currentEnd: "-]",
	incomingStart: "{+",
	incomingEnd: "+}",
	separator: " | ",
};

/**
 * Generates fine-grained custom conflict markers between two strings.
 *
 * @param base - The original string (optional).
 * @param current - The string from the current branch.
 * @param incoming - The string from the incoming branch.
 * @returns The merged string with custom conflict markers.
 */
export function generateCustomConflictMarkers(
	base: string | null,
	current: string,
	incoming: string
): string {
	// If base is provided, perform a three-way merge.
	// Otherwise, perform a two-way comparison.
	if (base) {
		return threeWayMerge(base, current, incoming);
	} else {
		return twoWayConflict(current, incoming);
	}
}

/**
 * Performs a two-way comparison and adds fine-grained custom conflict markers where differences are found.
 *
 * @param current - The string from the current branch.
 * @param incoming - The string from the incoming branch.
 * @returns The merged string with fine-grained custom conflict markers.
 */
function twoWayConflict(current: string, incoming: string): string {
	const currentLines: string[] = current.split("\n");
	const incomingLines: string[] = incoming.split("\n");
	const maxLength: number = Math.max(
		currentLines.length,
		incomingLines.length
	);
	let merged: string = "";

	for (let i = 0; i < maxLength; i++) {
		const currentLine: string | undefined = currentLines[i];
		const incomingLine: string | undefined = incomingLines[i];

		if (currentLine === incomingLine) {
			merged += currentLine !== undefined ? currentLine + "\n" : "";
		} else {
			const fineGrainedConflict = generateFineGrainedConflictWithinLine(
				currentLine || "",
				incomingLine || ""
			);
			merged += `${CONFLICT_MARKERS.currentStart} CURRENT ${CONFLICT_MARKERS.currentEnd}\n${fineGrainedConflict.current}\n${CONFLICT_MARKERS.incomingStart} INCOMING ${CONFLICT_MARKERS.incomingEnd}\n${fineGrainedConflict.incoming}\n`;
		}
	}

	return merged;
}

/**
 * Performs a three-way merge using the base, current, and incoming strings with fine-grained custom conflict markers.
 *
 * @param base - The original string.
 * @param current - The string from the current branch.
 * @param incoming - The string from the incoming branch.
 * @returns The merged string with fine-grained custom conflict markers.
 */
function threeWayMerge(
	base: string,
	current: string,
	incoming: string
): string {
	const diffsCurrent: Change[] = diffLines(base, current);
	const diffsIncoming: Change[] = diffLines(base, incoming);

	let merged: string = "";
	let i: number = 0,
		j: number = 0;

	while (i < diffsCurrent.length && j < diffsIncoming.length) {
		const partCurrent: Change = diffsCurrent[i];
		const partIncoming: Change = diffsIncoming[j];

		if (partCurrent.value === partIncoming.value) {
			merged += partCurrent.value;
			i++;
			j++;
		} else {
			// For simplicity, treat as conflict and generate fine-grained markers
			const fineGrainedConflict = generateFineGrainedConflictWithinLine(
				partCurrent.value,
				partIncoming.value
			);
			merged += `${CONFLICT_MARKERS.currentStart} CURRENT ${CONFLICT_MARKERS.currentEnd}\n${fineGrainedConflict.current}\n${CONFLICT_MARKERS.incomingStart} INCOMING ${CONFLICT_MARKERS.incomingEnd}\n${fineGrainedConflict.incoming}\n`;
			i++;
			j++;
		}
	}

	// Append any remaining parts
	while (i < diffsCurrent.length) {
		merged += diffsCurrent[i].value;
		i++;
	}

	while (j < diffsIncoming.length) {
		merged += diffsIncoming[j].value;
		j++;
	}

	return merged;
}

/**
 * Generates fine-grained custom conflict markers within a single line by performing a word-level diff.
 *
 * @param currentLine - The current branch's line.
 * @param incomingLine - The incoming branch's line.
 * @returns An object containing the current and incoming lines with inline conflict markers.
 */
export function generateFineGrainedConflictWithinLine(
	currentLine: string,
	incomingLine: string
): { current: string; incoming: string } {
	const diff = diffWords(currentLine, incomingLine);

	let currentConflict: string = "";
	let incomingConflict: string = "";

	diff.forEach((part) => {
		if (part.added) {
			// Text only in incoming
			incomingConflict += `${CONFLICT_MARKERS.incomingStart}${part.value}${CONFLICT_MARKERS.incomingEnd}`;
		} else if (part.removed) {
			// Text only in current
			currentConflict += `${CONFLICT_MARKERS.currentStart}${part.value}${CONFLICT_MARKERS.currentEnd}`;
		} else {
			// Text present in both
			currentConflict += part.value;
			incomingConflict += part.value;
		}
	});

	return { current: currentConflict, incoming: incomingConflict };
}
/**
 * Generates fine-grained custom conflict markers within a single line by performing a word-level diff.
 *
 * @param currentLine - The current branch's line.
 * @param incomingLine - The incoming branch's line.
 * @returns A single string with inline conflict markers.
 */
export function generateFineGrainedConflictWithinLineString(
	currentLine: string,
	incomingLine: string
): string {
	const diff = diffWords(currentLine, incomingLine);

	let conflict: string = "";

	diff.forEach((part) => {
		if (part.added) {
			// Text only in incoming
			conflict += `{+${part.value}+}`;
		} else if (part.removed) {
			// Text only in current
			conflict += `[-${part.value}-]`;
		} else {
			// Text present in both
			conflict += part.value;
		}
	});

	return conflict;
}
