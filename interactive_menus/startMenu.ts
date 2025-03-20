import { Menu } from "@grammyjs/menu";
import { MyContext } from "../bot.js";
import { sendNextInfoBlock } from "../prisma/db.js";

export const startMenu = new Menu<MyContext>("startMenu")
	.text("База знаний", async (ctx) => {
		await ctx.reply(
			"Вы можете задавать вопросы о продукте, а наш бот ответит на них. Чтобы прекратить диалог, просто отправьте команду /start",
		);
		ctx.session.isChatting = true;
	})
	.row()
	.text("Начать обучение", async (ctx) => {
		console.log(ctx.msg?.from?.id);
		const res = await sendNextInfoBlock(ctx.msg?.chat?.id.toString()!);
		if (!res) {
			await ctx.reply(
				"На сегодня весь блок информации изучен, до встречи завтра!",
			);
		}
	});
