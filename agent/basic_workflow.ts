// базовый граф работы ИИ. Паттерн называется ReAct Agent. Подробнее о нем можно почитать на сайте langchain

import {
	Annotation,
	Messages,
	messagesStateReducer,
	StateGraph,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import "dotenv/config";
import { AIMessage, BaseMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { findInfo } from "./tools.js";
import { Tool } from "@langchain/core/tools";

const StateAnnotation = Annotation.Root({
	annotation: Annotation<string>({
		reducer: (prev, next) => prev.concat(next),
	}),
	messages: Annotation<BaseMessage[], Messages>({
		reducer: messagesStateReducer,
	}),
});

// формируем список инструментов, чтобы разом прокинуть их в модель
const tools: any[] = [findInfo];
const toolNode = new ToolNode(tools, { handleToolErrors: true });
// const model = new LLM().model;
const model = new ChatGoogleGenerativeAI({
	baseUrl: "https://api.proxyapi.ru/google",
	model: "gemini-2.0-flash",
	maxOutputTokens: 2048,
});
function shouldContinue(state: typeof StateAnnotation.State) {
	const messages = state.messages;
	const lastMessage = messages[messages.length - 1] as AIMessage;
	if (lastMessage.tool_calls?.length) {
		return "tools";
	}
	return "__end__";
}

async function callModel(state: typeof StateAnnotation.State) {
	const modelWithTools = model.bindTools(tools);
	const systemPrompt =
		"Ты сотрудник техподдержки компании Fynlo. Твоя задача отвечать на вопросы клиентов о продукте Fynlo. Не отклоняйся от своей основной задачи. Используй инструмент findInfo, чтобы найти ответ на вопросы, которые задает клиент. Если инструмент даст неподходящий ответ на вопрос, не придумывай ответ, а просто ответь, 'Я не владею этой информацией. Обратитесь в службу поддержки'";
	const messages = [
		{ role: "system", content: systemPrompt },
		...state.messages,
	];
	const response = (await modelWithTools.invoke(messages)) as any;
	// console.log(response.tokenUsage!);
	return { messages: [response] };
}

export const workflow = new StateGraph(StateAnnotation)
	.addNode("agent", callModel)
	.addNode("tools", toolNode)
	.addEdge("__start__", "agent")
	.addConditionalEdges("agent", shouldContinue)
	.addEdge("tools", "agent");
