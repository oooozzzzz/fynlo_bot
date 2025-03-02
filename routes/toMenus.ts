import { Context, InlineKeyboard } from "grammy";
import { startMenu } from "../interactive_menus/startMenu";
import { adminMenu } from "../interactive_menus/adminMenu";

export const toMainMenu = async (ctx: Context) => {
	await ctx.reply("Выберите действие", { reply_markup: startMenu });
};
export const toAdminMenu = async (ctx: Context) => {
	await ctx.reply("Перейти в панель администратора", {
		reply_markup: new InlineKeyboard().text(
			"В панель администратора",
			"adminMenu",
		),
	});
};
