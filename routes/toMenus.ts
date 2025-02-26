import { Context } from "grammy";
import { startMenu } from "../interactive_menus/startMenu";

export const toMainMenu = async (ctx: Context) => {
	await ctx.reply("Выберите действие", { reply_markup: startMenu });
};
