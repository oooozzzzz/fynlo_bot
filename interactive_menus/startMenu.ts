import { Menu } from "@grammyjs/menu";
import { Context } from "grammy";
import { MyContext } from "../bot";

export const startMenu = new Menu("startMenu").text("Старт", async (ctx) => {
	await ctx.answerCallbackQuery("Start");
});
