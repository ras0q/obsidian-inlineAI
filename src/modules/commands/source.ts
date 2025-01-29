import { autocompletion, CompletionContext } from "@codemirror/autocomplete"
/**
 * 
 * Interface describing a slash command.
 */
export interface SlashCommand {
  keyword: string;
  prompt: string;
}


// Factory function that creates a completion source with custom parameters
function createSlashCommandSource(options: {
  prefix?: string,
  customCommands: SlashCommand[]
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
        label: cmd.keyword,
        type: "text",
        detail: cmd.prompt,
      }))
    }
  }
}

// Create the extension that uses our custom completion source.
export function slashCommandAutocompletion(options: { prefix?: string, customCommands: SlashCommand[] } = { customCommands: [] }) {
  return autocompletion({
    override: [createSlashCommandSource(options)]
  })
}