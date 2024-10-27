// api.ts
import ollama from "ollama";

export async function callApi(
	content: string,
	context: string
): Promise<string> {
	const response = await ollama.chat({
		model: "llama3.2",
		messages: [
			{
				role: "system",
				content:
					"Reply to the user request, do not add any intro messages or any alternative outputs, just do one example of what you are told",
			},
			{ role: "user", content: "```" + context + "\n" + content + "```" },
		],
	});
	console.log(response.message.content);
	return response.message.content;
}
