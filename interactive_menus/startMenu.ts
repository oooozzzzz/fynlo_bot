import { Menu } from "@grammyjs/menu";
import { MyContext } from "../bot.js";
import { hasFinishedInfoBlocks, sendNextInfoBlock } from "../prisma/db.js";

export const startMenu = new Menu<MyContext>("startMenu")
	.text("База знаний", async (ctx) => {
		await ctx.reply(
			"Вы можете задавать вопросы о продукте, а наш бот ответит на них. Чтобы прекратить диалог, просто отправьте команду /start",
		);
		ctx.session.isChatting = true;
	})
	.row()
	.text("Приступить к обучению", async (ctx) => {
		if (await hasFinishedInfoBlocks(ctx.msg?.chat?.id.toString()!)) {
			return ctx.reply(
				"Вы уже прошли обучение. Вы можете спросить нашего ИИ бота о продукте. Для этого перейдите в раздел База знаний",
			);
		}
		const res = await sendNextInfoBlock(ctx.msg?.chat?.id.toString()!);
		if (!res) {
			await ctx.reply(
				"На сегодня весь блок информации изучен, до встречи завтра!",
			);
		}
	});
