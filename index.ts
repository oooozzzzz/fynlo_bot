import { api, bot } from "./bot.js";
import cron from "node-cron";
import {
	getAllUsers,
	hasFinishedInfoBlocks,
	sendNextQuestion,
} from "./prisma/db.js";
import { InlineKeyboard } from "grammy";
import { delay } from "./serviceFunctions.js";
async function main() {
	bot.catch((err: Error) => {
		console.error("Error while handling update", err);
	});
	cron
		.schedule(
			"10 * * * * *",
			async () => {
				const users = await getAllUsers();
				for (const user of users) {
					if (await hasFinishedInfoBlocks(user.id)) continue;
					await api.sendMessage(
						user.id,
						"Добрый день! Пришло время проверить полученные знания. Приступим?",
						{ reply_markup: new InlineKeyboard().text("Да!", "nextQuestion") },
					);
					await delay(100);
				}
			},
			{ timezone: "Europe/Moscow" },
		)
		.start();
	bot.start();
	console.log("Bot started");
}
main();
