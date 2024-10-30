// api.ts
import ollama from "ollama";
import {
	generateFineGrainedConflictWithinLine,
	generateFineGrainedConflictWithinLineString,
} from "./helpers/conflictMarkers";
export async function callApi(
	content: string,
	context: string
): Promise<{ generated: string; diff: string }> {
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
	const generatedContent = response.message.content;
	console.log(
		generateFineGrainedConflictWithinLine(context, generatedContent)
	);
	return {
		generated: generatedContent,
		diff: generateFineGrainedConflictWithinLineString(
			context,
			generatedContent
		),
	};
}
