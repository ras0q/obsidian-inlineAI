import { autocompletion, CompletionContext } from "@codemirror/autocomplete"
import { EditorView } from "@codemirror/view"

import { slashCommands } from "./commands"


function slashCommandCompletionSource(context: CompletionContext) {
  let word = context.matchBefore(/^\/\w*/)
  if (!word || (word.from == word.to && !context.explicit))
    return null
  return {
    from: word.from+1,
    options: slashCommands.map(cmd => ({
      label: cmd.label,
      type: "text"
    }))
  }
}


// Create the extension that uses our custom completion source.
export const slashCommandAutocompletion = autocompletion({
  override: [slashCommandCompletionSource]
})

