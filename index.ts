import { bot } from "./bot";
import cron from "node-cron";
bot.catch((err) => {
	console.error("Error while handling update", err);
});
cron
	.schedule(
		"0 18 * * *",
		async () => {
			console.log("Cron job is running");
		},
		{ scheduled: true, timezone: "Europe/Moscow" },
	)
	.start();
bot.start();
console.log("Bot started");
