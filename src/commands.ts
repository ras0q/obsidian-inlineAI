import { EditorView } from "@codemirror/view";
import { Command } from "./types";

// Default commands that will be available if no custom commands are defined
export const defaultCommands: Command[] = [
    {
        label: "Bold",
        detail: "Apply bold formatting",
        info: "Wrap the selected text in double asterisks (**bold**).",
        apply: (view: EditorView) => {
            const { state } = view;
            const { from, to } = state.selection.main;
            const selectedText = state.sliceDoc(from, to);
            const replacement = `**${selectedText}**`;

            view.dispatch({
                changes: { from, to, insert: replacement },
                selection: { anchor: from + 2, head: from + 2 + selectedText.length }
            });
        }
    },
    {
        label: "Italic",
        detail: "Apply italic formatting",
        info: "Wrap the selected text in single asterisks (*italic*).",
        apply: (view: EditorView) => {
            const { state } = view;
            const { from, to } = state.selection.main;
            const selectedText = state.sliceDoc(from, to);
            const replacement = `*${selectedText}*`;

            view.dispatch({
                changes: { from, to, insert: replacement },
                selection: { anchor: from + 1, head: from + 1 + selectedText.length }
            });
        }
    }
];

// Function to convert a custom command to a Command object
export function createCustomCommand(name: string, prompt: string): Command {
    return {
        label: name,
        detail: "Custom command",
        info: prompt,
        apply: (view: EditorView) => {
            const { state } = view;
            const { from, to } = state.selection.main;
            const selectedText = state.sliceDoc(from, to);
            
            // Here you would typically handle the custom command
            // For now, we'll just wrap it in a special syntax
            const replacement = `{{${name}:${selectedText}}}`;
            
            view.dispatch({
                changes: { from, to, insert: replacement }
            });
        }
    };
}
