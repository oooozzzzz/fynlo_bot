import { Context } from "grammy";
import { handleAnswerDB } from "../prisma/db.js";

export const handleAnswer = async (ctx: Context, data: string[]) => {
	const [action, questionId, answerId, isCorrect] = data;
	await ctx.answerCallbackQuery(
		isCorrect === "correct" ? "Правильно" : "Неправильно",
	);
	await handleAnswerDB(
		ctx.chat!.id.toString(),
		parseInt(questionId),
		parseInt(answerId),
	);
};
