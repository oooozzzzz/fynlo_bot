import { api, bot } from "./bot.js";
import cron from "node-cron";
import {
	getAllUsers,
	hasFinishedInfoBlocks,
	questionsReminder,
	sendNextQuestion,
	setStage,
} from "./prisma/db.js";
import { InlineKeyboard } from "grammy";
import { delay } from "./serviceFunctions.js";
async function main() {
	bot.catch((err: Error) => {
		console.log("Error while handling update", err);
	});
	cron
		.schedule(
			"0 0 16 * * *",
			// "*/20 * * * * *",
			async () => {
				const users = await getAllUsers();
				for (const user of users) {
					console.log(user);
					if ((await hasFinishedInfoBlocks(user.id)) || user.stage !== 1)
						continue;
					questionsReminder.sendMessage(user.id);
					await api.sendMessage(
						user.id,
						"Добрый день! Пришло время проверить полученные знания. Приступим?",
						{ reply_markup: new InlineKeyboard().text("Да!", "nextQuestion") },
					);
					await setStage(user.id, 2);
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
