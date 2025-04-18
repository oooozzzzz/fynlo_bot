import { Context, InlineKeyboard } from "grammy";
import { startMenu } from "../interactive_menus/startMenu.js";
import { adminMenu } from "../interactive_menus/adminMenu.js";

export const toMainMenu = async (ctx: Context) => {
	await ctx.reply(
		`Привет!
Добро пожаловать в обучающий бот бренда FYNLO — это больше, чем просто коллаген.

Нажми «Приступить к обучению», чтобы узнать всё самое важное о продукте,
или выбери «Базу знаний», если хочешь быстро найти ответ на конкретный вопрос.`,
		{ reply_markup: startMenu },
	);
};
export const toAdminMenu = async (ctx: Context) => {
	await ctx.reply("Перейти в панель администратора", {
		reply_markup: new InlineKeyboard().text(
			"В панель администратора",
			"adminMenu",
		),
	});
};
