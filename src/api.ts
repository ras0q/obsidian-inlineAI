// api.ts
export async function callApi(content: string): Promise<string> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve("API response for content: " + content);
		}, 2000);
	});
}
