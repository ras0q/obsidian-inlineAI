import { SlashCommand } from "./source";
 
  
export function parseCommand(userInput: string, prefix: string, customCommands: SlashCommand[]): string {
for (const command of customCommands) {
    const commandPattern = `${prefix}${command.keyword}`;
    if (userInput.startsWith(commandPattern)) {
    return userInput.replace(commandPattern, command.prompt).trim();
    }
}
return userInput; // Return original text if no command matches
}
