import { bot } from "./bot.js";
import cron from "node-cron";
async function main() {
	bot.catch((err: Error) => {
		console.error("Error while handling update", err);
	});
	cron
		.schedule(
			"18 * * * *",
			async () => {
				console.log("Cron job is running");
			},
			{ scheduled: true, timezone: "Europe/Moscow" },
		)
		.start();
	bot.start();
	console.log("Bot started");
}
main();
