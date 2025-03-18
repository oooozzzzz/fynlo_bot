import { Conversation } from "@grammyjs/conversations";
import { MyContext, MyConversation, MyConversationContext } from "../bot.js";
import { cancelKeyboard } from "../inline_keyboards/cancelKeyboard.js";
import { Context, InlineKeyboard } from "grammy";
import {
	calculateDuration,
	delay,
	processArrayAsync,
} from "../serviceFunctions.js";
import { toAdminMenuKeyboard } from "../inline_keyboards/toAdminMenuKeyboard.js";

export const sendOutConversation = async (
	conversation: MyConversation,
	ctx: MyConversationContext,
	recievers: number[],
) => {
	const start = conversation.checkpoint();
	await ctx.reply("Введите текст рассылки", {
		reply_markup: cancelKeyboard("Отмена"),
	});
	const message = await conversation.wait();
	if (message.update.callback_query?.data == "cancel") {
		await ctx.reply("Рассылка отменена", {
			reply_markup: toAdminMenuKeyboard("В панель администратора"),
		});
		return conversation.halt();
	}
	const menu = new InlineKeyboard()
		.text("Отправить", "send")
		.row()
		.text("Изменить текст", "cancel");
	const copiedMessage = await message.copyMessage(ctx.from!.id, {
		reply_markup: menu,
	});
	const update = await conversation.waitFor("callback_query:data", {
		otherwise: (ctx) => ctx.reply("Пожалуйста, воспользуйтесь кнопками"),
	});
	if (update.callbackQuery?.data == "cancel") {
		await ctx.api.deleteMessage(ctx.from!.id, copiedMessage.message_id);
		await conversation.rewind(start);
	}
	if (update.callbackQuery?.data == "send") {
		// sending message to recievers
		update.answerCallbackQuery();
		const duration = calculateDuration(150, recievers.length);
		await ctx.reply(`Рассылка началась. Это займет примерно ${duration}`);
		const result = await processArrayAsync(
			recievers,
			async (reciever: number) => {
				await ctx.api.copyMessage(
					reciever,
					ctx.from!.id,
					copiedMessage.message_id,
				);
				await delay(150);
			},
		);
		await ctx.reply(
			`Рассылка завершена. Доставлено ${
				result.filter((r) => r.status == "success").length
			} сообщений`,
			{ reply_markup: toAdminMenuKeyboard("В панель администратора") },
		);
	}
};
