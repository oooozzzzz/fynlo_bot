import { InlineKeyboard } from "grammy";
import { MyConversation, MyConversationContext } from "../bot.js";
import { cancelKeyboard } from "../inline_keyboards/cancelKeyboard.js";
import { toMainMenuKeyboard } from "../inline_keyboards/toAdminMenuKeyboard.js";

const generateAnswerKeyboard = (id: number) => {
	const answerKeyboard = new InlineKeyboard().text(
		"Ответить пользователю",
		`question-${id}`,
	);
	return answerKeyboard;
};

export const answerQuestion = async (
	conversation: MyConversation,
	ctx: MyConversationContext,
	userId: number,
) => {
	const beginning = await ctx.reply("Введите ответ", {
		reply_markup: cancelKeyboard("Отмена"),
	});
	const answerCtx = await conversation.wait();
	const answer = answerCtx.message?.text;
	if (!answer) {
		answerCtx.msg?.delete();
		return ctx.reply("Операция отменена");
	}
	try {
		await ctx.api.deleteMessage(beginning.chat.id, beginning.message_id);
		await ctx.api.sendMessage(userId, `Ответ от администратора:\n\n${answer}`);
		await ctx.reply("Ваш ответ передан пользователю!");
	} catch (error) {}
};

export const askQuestion = async (
	conversation: MyConversation,
	ctx: MyConversationContext,
) => {
	const beginning = await ctx.reply(
		"Введите Ваш вопрос или пожелание, я сразу же передам его администратору",
		{
			reply_markup: cancelKeyboard("Отмена"),
		},
	);
	const questionCtx = await conversation.wait();
	const question = questionCtx.message?.text;
	if (!question) {
		questionCtx.msg?.delete();
		return ctx.reply("Операция отменена", {
			reply_markup: toMainMenuKeyboard("Вернуться в меню"),
		});
	}
	await ctx.api.deleteMessage(beginning.chat.id, beginning.message_id);
	await ctx.api.sendMessage(
		-1002578844283,
		`Вопрос от @${questionCtx.from?.username}\n\n${question}`,
		{ reply_markup: generateAnswerKeyboard(questionCtx.from?.id!) },
	);
	await ctx.api.sendMessage(
		762569950,
		`Вопрос от @${questionCtx.from?.username}\n\n${question}`,
		{ reply_markup: generateAnswerKeyboard(questionCtx.from?.id!) },
	);
	await ctx.reply("Ваш вопрос передан администратору!", {
		reply_markup: toMainMenuKeyboard("Вернуться в меню"),
	});
};
