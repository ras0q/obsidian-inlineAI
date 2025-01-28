export const slashCommands = [
    {
      label: "Bold",
      detail: "Apply bold formatting",
      info: "Wrap the selected text in double asterisks (**bold**).",
      apply: (view: EditorView) => {
        const { state } = view
        const { from, to } = state.selection.main
        const selectedText = state.sliceDoc(from, to)
        const replacement = `**${selectedText}**`
  
        view.dispatch({
          changes: { from, to, insert: replacement },
          selection: { anchor: from + 2, head: from + 2 + selectedText.length }
        })
      }
    },
    {
      label: "Italic",
      detail: "Apply italic formatting",
      info: "Wrap the selected text in single asterisks (*italic*).",
      apply: (view: EditorView) => {
        const { state } = view
        const { from, to } = state.selection.main
        const selectedText = state.sliceDoc(from, to)
        const replacement = `*${selectedText}*`
  
        view.dispatch({
          changes: { from, to, insert: replacement },
          selection: { anchor: from + 1, head: from + 1 + selectedText.length }
        })
      }
    },
    {
      label: "Strikethrough",
      detail: "Apply strikethrough formatting",
      info: "Wrap the selected text in double tildes (~~strikethrough~~).",
      apply: (view: EditorView) => {
        const { state } = view
        const { from, to } = state.selection.main
        const selectedText = state.sliceDoc(from, to)
        const replacement = `~~${selectedText}~~`
  
        view.dispatch({
          changes: { from, to, insert: replacement },
          selection: { anchor: from + 2, head: from + 2 + selectedText.length }
        })
      }
    },
    {
      label: "Heading 1",
      detail: "Apply Heading 1 format",
      info: "Add a single hash (#) before the selected text.",
      apply: (view: EditorView) => {
        const { state } = view
        const { from, to } = state.selection.main
        const selectedText = state.sliceDoc(from, to)
        const replacement = `# ${selectedText}`
  
        view.dispatch({
          changes: { from, to, insert: replacement },
          selection: { anchor: from + 2, head: from + 2 + selectedText.length }
        })
      }
    },
    {
      label: "Heading 2",
      detail: "Apply Heading 2 format",
      info: "Add two hashes (##) before the selected text.",
      apply: (view: EditorView) => {
        const { state } = view
        const { from, to } = state.selection.main
        const selectedText = state.sliceDoc(from, to)
        const replacement = `## ${selectedText}`
  
        view.dispatch({
          changes: { from, to, insert: replacement },
          selection: { anchor: from + 3, head: from + 3 + selectedText.length }
        })
      }
    },
    {
      label: "Heading 3",
      detail: "Apply Heading 3 format",
      info: "Add three hashes (###) before the selected text.",
      apply: (view: EditorView) => {
        const { state } = view
        const { from, to } = state.selection.main
        const selectedText = state.sliceDoc(from, to)
        const replacement = `### ${selectedText}`
  
        view.dispatch({
          changes: { from, to, insert: replacement },
          selection: { anchor: from + 4, head: from + 4 + selectedText.length }
        })
      }
    },
    {
      label: "Insert Link",
      detail: "Insert a hyperlink",
      info: "Wrap the selected text in Markdown link syntax ([text](url)).",
      apply: (view: EditorView) => {
        const { state } = view
        const { from, to } = state.selection.main
        const selectedText = state.sliceDoc(from, to) || "link text"
        const replacement = `[${selectedText}](url)`
  
        view.dispatch({
          changes: { from, to, insert: replacement },
          selection: { anchor: from + selectedText.length + 3, head: from + selectedText.length + 6 }
        })
      }
    },
    {
      label: "Insert Blockquote",
      detail: "Apply blockquote formatting",
      info: "Add a greater-than sign (>) before the selected text.",
      apply: (view: EditorView) => {
        const { state } = view
        const { from, to } = state.selection.main
        const selectedText = state.sliceDoc(from, to)
        const replacement = `> ${selectedText}`
  
        view.dispatch({
          changes: { from, to, insert: replacement },
          selection: { anchor: from + 2, head: from + 2 + selectedText.length }
        })
      }
    },
    {
      label: "Insert Code Block",
      detail: "Insert a code block",
      info: "Wrap the selected text in triple backticks (```code```)",
      apply: (view: EditorView) => {
        const { state } = view
        const { from, to } = state.selection.main
        const selectedText = state.sliceDoc(from, to) || "code"
        const replacement = `\`\`\`\n${selectedText}\n\`\`\``
  
        view.dispatch({
          changes: { from, to, insert: replacement },
          selection: { anchor: from + 4, head: from + 4 + selectedText.length }
        })
      }
    },
    {
      label: "Insert Checklist",
      detail: "Insert a checklist item",
      info: "Add a checklist format (- [ ] ) before the text.",
      apply: (view: EditorView) => {
        const { state } = view
        const { from, to } = state.selection.main
        const selectedText = state.sliceDoc(from, to) || "task"
        const replacement = `- [ ] ${selectedText}`
  
        view.dispatch({
          changes: { from, to, insert: replacement },
          selection: { anchor: from + 6, head: from + 6 + selectedText.length }
        })
      }
    },
    {
      label: "Insert Date",
      detail: "Insert the current date",
      info: "Adds the current date (in your locale's format) at the cursor position.",
      apply: (view: EditorView) => {
        const now = new Date().toLocaleDateString()
        const { state } = view
        const { from, to } = state.selection.main
  
        view.dispatch({
          changes: { from, to, insert: now }
        })
      }
    },
    {
      label: "Insert Time",
      detail: "Insert the current time",
      info: "Adds the current time (in your locale's format) at the cursor position.",
      apply: (view: EditorView) => {
        const now = new Date().toLocaleTimeString()
        const { state } = view
        const { from, to } = state.selection.main
  
        view.dispatch({
          changes: { from, to, insert: now }
        })
      }
    }
  ]
  