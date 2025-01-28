import { autocompletion, CompletionContext } from "@codemirror/autocomplete"


// Factory function that creates a completion source with custom parameters
function createSlashCommandSource(options: {
  prefix?: string,
  customCommands: Array<{ label: string, type: string }>
} = { 
  prefix: '/', 
  customCommands: []
}) {
  const { prefix, customCommands } = options;
  console.log(prefix, customCommands)
  return (context: CompletionContext) => {
    let word = context.matchBefore(new RegExp(`^\\${prefix}\\w*`))
    if (!word || (word.from == word.to && !context.explicit))
      return null
    return {
      from: word.from+1,
      options: (customCommands).map(cmd => ({
        label: cmd.label,
        type: "text"
      }))
    }
  }
}

// Create the extension that uses our custom completion source.
export const slashCommandAutocompletion = (options = { customCommands: [] }) => autocompletion({
  override: [createSlashCommandSource(options)]
})
