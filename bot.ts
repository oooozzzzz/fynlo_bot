import { Api, Bot, session, SessionFlavor, type Context } from "grammy";
import "dotenv/config";
import { startMenu } from "./interactive_menus/startMenu";
import {
	type ConversationFlavor,
	conversations,
	createConversation,
} from "@grammyjs/conversations";
import { introduce } from "./conversations/introduce";
import { create } from "domain";
import { createQuestion } from "./conversations/createQuestion";
import { sendInfo, sendQuestions } from "./serviceFunctions";
import { callbackQueryHandler } from "./handlers/callbackQueryHandler";
import { updateQuestion } from "./conversations/updateQuestion";
import { createInfo } from "./conversations/createInfo";
import { addQuestionConversation } from "./conversations/addQuestionToInfo";
import {
	clearInfoInUser,
	createUser,
	deleteUser,
	sendNextInfoBlock,
	sendNextQuestion,
} from "./prisma/db";
import { createOrganization } from "./conversations/createOrganization";
import { createUserConversation } from "./conversations/createUser";

interface SessionData {}

const token = process.env.BOT_TOKEN;
export const api = new Api(token!);
export type MyContext = Context &
	SessionFlavor<SessionData> &
	ConversationFlavor<Context>;

const initial = (): SessionData => ({});

export const bot = new Bot<MyContext>(token!);
bot.use(session({ initial }));
bot.use(
	conversations({
		plugins: [startMenu],
	}),
);
bot.use(createConversation(introduce));
bot.use(createConversation(createQuestion));
bot.use(createConversation(updateQuestion));
bot.use(createConversation(createInfo));
bot.use(createConversation(createUserConversation));
bot.use(createConversation(createOrganization));
bot.use(createConversation(addQuestionConversation));
bot.use(startMenu);

bot.api.setMyCommands([
	{
		command: "start",
		description: "Начать работу с ботом/создать пользователя",
	},
	{ command: "question", description: "Создать вопрос" },
	{ command: "delete", description: "Удалить пользователя" },
	{ command: "clear_history", description: "Очистить историю ответов" },
	// { command: "questions", description: "Вывести все вопросы" },
	{ command: "add_info", description: "Добавить инфоблок" },
	{ command: "show_info", description: "Показать инфоблоки" },
	{ command: "next_info", description: "Отправить следующий инфоблок" },
	{ command: "next_question", description: "Отправить следующий вопрос" },
	{ command: "create_organization", description: "Создать организацию" },
]);

bot.command("start", async (ctx) => {
	const user = await createUser({
		id: ctx.from!.id,
	});
	if (!user.position) {
		return await ctx.conversation.enter("createUserConversation");
	}
	await ctx.reply("Стартовый текст");
});
bot.command("add_info", async (ctx) => {
	await ctx.conversation.enter("createInfo");
});
bot.command("create_organization", async (ctx) => {
	await ctx.conversation.enter("createOrganization");
});

bot.command("show_info", async (ctx) => {
	await sendInfo(ctx);
});
bot.command("next_question", async (ctx) => {
	await ctx.reply(
		"Следующий вопрос: \n\nЕсли ничего нет, значит вопросы кончились",
	);
	await sendNextQuestion(ctx.chat!.id);
});
bot.command("delete", async (ctx) => {
	await deleteUser(ctx.from!.id);
});
bot.command("next_info", async (ctx) => {
	await ctx.reply(
		"Следующий инфоблок: \n\nЕсли ничего нет, значит инфоблоки кончились",
	);
	await sendNextInfoBlock(ctx.chat!.id);
	// await sendNextQuestion(ctx.chat!.id);
});

bot.on("callback_query:data", async (ctx) => {
	await callbackQueryHandler(ctx);
});

bot.command(
	"question",
	async (ctx) => await ctx.conversation.enter("createQuestion"),
);
bot.command("clear_history", async (ctx) => {
	await clearInfoInUser(ctx.chat.id);
	await ctx.reply("История очищена");
});
bot.command("questions", async (ctx) => await sendQuestions(ctx));

bot.on("message", (ctx: Context) => ctx.reply("Got another message!"));
