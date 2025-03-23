import { InlineKeyboard } from "grammy";
import { api, MyConversation, MyConversationContext } from "../bot.js";
import { createQuestion } from "./createQuestion.js";
import { toAdminMenuKeyboard } from "../inline_keyboards/toAdminMenuKeyboard.js";
import { getAllUsers, hasFinishedInfoBlocks } from "../prisma/db.js";
import { delay, sendQuestion } from "../serviceFunctions.js";

export const sendOutQuestion = async (
	conversation: MyConversation,
	ctx: MyConversationContext,
) => {
	const question = await createQuestion(conversation, ctx);
	if (!question) return;
	conversation.external(async () => {
		await sendQuestion(question, ctx.chat!.id.toString());
	});
	await ctx.reply("Отправить вопрос?", {
		reply_markup: new InlineKeyboard()
			.text("Отправить", "send")
			.row()
			.text("Отменить", "cancel"),
	});
	const update = await conversation.waitFor("callback_query:data", {
		otherwise: (ctx) => ctx.reply("Пожалуйста, воспользуйтесь кнопками"),
	});
	if (update.callbackQuery?.data == "cancel") {
		await ctx.reply("Отменено");
		return conversation.halt();
	}
	if (update.callbackQuery?.data == "send") {
		await api.answerCallbackQuery(update.callbackQuery!.id);
		const users = await getAllUsers();
		await ctx.reply("Рассылка началась", {
			reply_markup: toAdminMenuKeyboard("В панель администратора"),
		});
		conversation.external(async () => {
			for (const user of users) {
				if (await hasFinishedInfoBlocks(user.id)) {
					sendQuestion(question, user.id);
					await delay(300);
				}
			}
		});
	}
};
