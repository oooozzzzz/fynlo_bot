import { Conversation } from "@grammyjs/conversations";
import { Context } from "grammy";
import { cancelKeyboard } from "../inline_keyboards/cancelKeyboard";
import { toMainMenu } from "../routes/toMenus";
import {
	checkForCancel,
	isCommaSeparatedWords,
	sendQuestions,
	splitCommaSeparatedString,
} from "../serviceFunctions";
import { createQuestionsDB, getQuestionsCount } from "../prisma/db";

export const createQuestion = async (
	conversation: Conversation,
	ctx: Context,
) => {
	await ctx.reply("Введите текст вопроса:", {
		reply_markup: cancelKeyboard("Отмена"),
	});

	const text = await conversation.form.text({
		otherwise: (ctx) => checkForCancel(ctx, conversation, toMainMenu),
	});
	await ctx.reply(
		"Введите варианты ответа на вопрос через запятую. Верный ответ должен быть первым:",
		{
			reply_markup: cancelKeyboard("Отмена"),
		},
	);
	const answers = await conversation.waitUntil(
		(ctx) => isCommaSeparatedWords(ctx.message?.text!),
		{
			otherwise: (ctx) =>
				checkForCancel(
					ctx,
					conversation,
					toMainMenu,
					"Пожалуйста, введите несколько вариантов ответа через запятую",
				),
		},
	);
	const formattedAnswers = splitCommaSeparatedString(answers.message?.text!);
	const result = await createQuestionsDB(
		text,
		(await getQuestionsCount()) + 1,
		formattedAnswers.map((answer, i) => ({ text: answer, isCorrect: i === 0 })),
	);
	if (result) {
		await ctx.reply("Вопрос создан!");
		return result;
	} else {
		await ctx.reply("Ошибка!");
		return false;
	}
};
