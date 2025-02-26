import { Conversation } from "@grammyjs/conversations";
import { MyContext } from "../bot";
import { createQuestion } from "./createQuestion";
import { addQuestionToInfo } from "../prisma/db";
import { Context } from "grammy";

export const addQuestionConversation = async (
	conversation: Conversation,
	ctx: Context,
	infoId: number,
) => {
	const question = await createQuestion(conversation, ctx);
	if (!question) return;
	await addQuestionToInfo(infoId, question.id);
	await ctx.reply("Вопрос добавлен");
};
