import { Conversation } from "@grammyjs/conversations";
import { MyContext, MyConversation, MyConversationContext } from "../bot.js";
import { createQuestion } from "./createQuestion.js";
import { addQuestionToInfo } from "../prisma/db.js";
import { Context } from "grammy";

export const addQuestionConversation = async (
	conversation: MyConversation,
	ctx: MyConversationContext,
	infoId: number,
) => {
	const question = await createQuestion(conversation, ctx);
	if (!question) return;
	await addQuestionToInfo(infoId, question.id);
};
