import {
	Api,
	Bot,
	InlineKeyboard,
	session,
	SessionFlavor,
	type Context,
} from "grammy";
import "dotenv/config";
import { startMenu } from "./interactive_menus/startMenu";
import { hydrate, HydrateFlavor } from "@grammyjs/hydrate";
import {
	Conversation,
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
	deleteOrganizationDB,
	deleteUser,
	getPassword,
	getUser,
	sendNextInfoBlock,
	sendNextQuestion,
} from "./prisma/db";
import { createOrganization } from "./conversations/createOrganization";
import { createUserConversation } from "./conversations/createUser";
import { addUserToSheets } from "./sheets";
import { adminMenu } from "./interactive_menus/adminMenu";
import { sendOutConversation } from "./conversations/sendOutConversation";
import { changePasswordConversation } from "./conversations/changePasswordConversation";
import { toAdminMenu } from "./routes/toMenus";
import { EmojiFlavor, emojiParser } from "@grammyjs/emoji";
import { admin } from "googleapis/build/src/apis/admin";
import { hydrateReply } from "@grammyjs/parse-mode";
import type { ParseModeFlavor } from "@grammyjs/parse-mode";

interface SessionData {}
const token = process.env.BOT_TOKEN;
export const api = new Api(token!);
export type MyContext = Context &
	ParseModeFlavor<Context> &
	EmojiFlavor<Context> &
	SessionFlavor<SessionData> &
	HydrateFlavor<Context> &
	ConversationFlavor<Context>;
export type MyConversationContext = Context &
	EmojiFlavor<Context> &
	ParseModeFlavor<Context> &
	SessionFlavor<SessionData> &
	HydrateFlavor<Context>;

export type MyConversation = Conversation<MyContext, MyConversationContext>;
const initial = (): SessionData => ({});

export const bot = new Bot<MyContext>(token!);
bot.use(session({ initial }));
bot.use(emojiParser());
bot.use(hydrate());
// @ts-ignore
bot.use(hydrateReply);
bot.use(
	conversations<MyContext, MyConversationContext>({
		plugins: [startMenu, emojiParser(), hydrate()],
	}),
);
bot.use(createConversation(introduce));
bot.use(createConversation(changePasswordConversation));
bot.use(createConversation(createQuestion));
bot.use(createConversation(updateQuestion));
bot.use(createConversation(sendOutConversation));
bot.use(createConversation(createInfo));
bot.use(createConversation(createUserConversation));
bot.use(createConversation(createOrganization));
bot.use(createConversation(addQuestionConversation));
bot.use(adminMenu);
bot.use(startMenu);

bot.api.setMyCommands([
	{
		command: "start",
		description: "Начать работу с ботом/создать пользователя",
	},
	// { command: "question", description: "Создать вопрос" },
	{ command: "delete", description: "Удалить пользователя" },
	{ command: "clear_history", description: "Очистить историю ответов" },
	// { command: "questions", description: "Вывести все вопросы" },
	{ command: "add_info", description: "Добавить инфоблок" },
	{ command: "show_info", description: "Показать инфоблоки" },
	{ command: "next_info", description: "Отправить следующий инфоблок" },
	{ command: "next_question", description: "Отправить следующий вопрос" },
	{ command: "create_organization", description: "Создать организацию" },
]);

bot.command("start", async (ctx: MyContext) => {
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
	await sendNextQuestion(ctx.chat!.id);
});
bot.command("delete", async (ctx) => {
	const result = await deleteUser(ctx.from!.id);
	if (result) {
		await ctx.reply("Пользователь удален");
	} else {
		await ctx.reply("Пользователь не найден");
	}
});
bot.command("next_info", async (ctx) => {
	await ctx.reply(
		"Следующий инфоблок: \n\nЕсли ничего нет, значит инфоблоки кончились",
	);
	await sendNextInfoBlock(ctx.chat!.id);
	// await sendNextQuestion(ctx.chat!.id);
});

bot.callbackQuery("adminMenu", async (ctx) => {
	ctx.msg?.delete();
	await ctx.reply("Панель администратора", { reply_markup: adminMenu });
});
bot.callbackQuery("nextQuestion", async (ctx) => {
	ctx.msg?.editReplyMarkup(new InlineKeyboard().text("Я все понял(а)!", "!"));
	await sendNextQuestion(ctx.chat!.id);
});

bot.on("callback_query:data", async (ctx) => {
	await callbackQueryHandler(ctx);
});

bot.command(
	"question",
	async (ctx) => await ctx.conversation.enter("createQuestion"),
);
bot.command("rm_org", async (ctx) => {
	if (!ctx.match) return;
	const res = await deleteOrganizationDB(Number(ctx.match));
	res ? await ctx.reply("Организация удалена") : await ctx.reply("Ошибка");
});
bot.command("clear_history", async (ctx) => {
	await clearInfoInUser(ctx.chat.id);
	await ctx.reply("История очищена");
});
bot.command("questions", async (ctx) => await sendQuestions(ctx));
bot.command("add", async (ctx) => {
	await addUserToSheets(ctx.from!.id);
});

bot.on("message", async (ctx: MyContext) => {
	const password = await getPassword("1");
	if (password?.value! == ctx.message?.text) {
		ctx.reply("Панель администратора", { reply_markup: adminMenu });
	}
});
