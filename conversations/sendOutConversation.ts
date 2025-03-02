import { Conversation } from "@grammyjs/conversations";
import { MyContext, MyConversation, MyConversationContext } from "../bot";
import { cancelKeyboard } from "../inline_keyboards/cancelKeyboard";
import { Context, InlineKeyboard } from "grammy";

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
	if (message.update.callback_query?.data == "cancel") conversation.halt();
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
		ctx.reply("Рассылка началась");
	}
};
