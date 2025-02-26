import { Conversation } from "@grammyjs/conversations";
import { Context } from "grammy";

export const introduce = async (
	conversation: Conversation,
	ctx: Context,
	answer: string,
) => {
	await ctx.reply(`What is ${answer}?`);
	const message = await conversation.waitUntil(
		(ctx) => ctx.message?.text == answer,
		{
			otherwise: (ctx: Context) => {
				ctx.reply("Пожалуйста, напишите ответ");
			},
		},
	);
	if (message.msg?.text == answer) {
		await ctx.reply("Отлично!");
	}
};
