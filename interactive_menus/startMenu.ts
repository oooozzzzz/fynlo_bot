import { Menu } from "@grammyjs/menu";
import { MyContext } from "../bot.js";

export const startMenu = new Menu<MyContext>("startMenu").text(
	"База знаний",
	async (ctx) => {
		await ctx.reply(
			"Вы можете задавать вопросы о продукте, а наш бот ответит на них. Чтобы прекратить диалог, просто отправьте команду /start",
		);
		ctx.session.isChatting = true;
	},
);
