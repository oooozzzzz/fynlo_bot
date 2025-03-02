import { Menu } from "@grammyjs/menu";

export const startMenu = new Menu("startMenu").text("Старт", async (ctx) => {
	await ctx.answerCallbackQuery("Start");
});
