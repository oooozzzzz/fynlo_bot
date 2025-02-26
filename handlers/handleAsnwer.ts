import { Context } from "grammy";
import { handleAnswerDB } from "../prisma/db";

export const handleAnswer = async (ctx: Context, data: string[]) => {
	const [action, questionId, answerId, isCorrect] = data;
	await ctx.answerCallbackQuery(
		isCorrect === "correct" ? "Правильно" : "Неправильно",
	);
	await handleAnswerDB(ctx.chat!.id, parseInt(questionId), parseInt(answerId));
};
