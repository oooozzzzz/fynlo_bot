import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { retriever } from "./agent.js";
import { Document } from "@langchain/core/documents";

export const findInfo = tool(
	async ({ question }: { question: string }) => {
		const answer: Document[] = await retriever.invoke(question);
		const result = answer.map((a) => a.pageContent).join("\n");
		return result;
	},
	{
		name: "findInfo",
		description: "use when you need to find info",
		schema: z.object({
			question: z.string().describe("standalone question"),
		}),
	},
);
