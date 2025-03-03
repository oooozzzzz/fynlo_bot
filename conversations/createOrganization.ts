import { Conversation } from "@grammyjs/conversations";
import { Context, InlineKeyboard } from "grammy";
import { cancelKeyboard } from "../inline_keyboards/cancelKeyboard";
import { toAdminMenu } from "../routes/toMenus";
import {
	checkForCancel,
	escapeMarkdownV2,
	generateRandomDigits,
} from "../serviceFunctions";
import { createOrganizationDB } from "../prisma/db";
import { startMenu } from "../interactive_menus/startMenu";
import { api, MyContext, MyConversation } from "../bot";
import { toAdminMenuKeyboard } from "../inline_keyboards/toAdminMenuKeyboard";

export const createOrganization = async (
	conversation: MyConversation,
	ctx: Context,
) => {
	await ctx.reply("Введите название организации", {
		reply_markup: cancelKeyboard("Отмена"),
	});

	const name = await conversation.form.text({
		otherwise: (ctx) => checkForCancel(ctx, conversation, toAdminMenu),
	});

	await ctx.reply("Укажите нишу организации", {
		reply_markup: new InlineKeyboard()
			.text("Спа/клиники", "Спа/клиники")
			.row()
			.text("Спорт/велнес", "Спорт/велнес")
			.row()
			.text("Частники", "Частники")
			.row()
			.text("Отмена", "cancel"),
	});

	const update = await conversation.waitFor("callback_query:data");
	const category = update.callbackQuery?.data!;
	await api.answerCallbackQuery(update.callbackQuery!.id);
	console.log(category);
	if (category === "cancel") {
		await conversation.halt();
		await toAdminMenu(ctx);
		return;
	}
	const id = Number(generateRandomDigits());
	const organization = await createOrganizationDB({
		name,
		category,
		id,
	});
	if (!organization) return await ctx.reply("Произошла ошибка");
	await ctx.reply(
		escapeMarkdownV2(
			`Организация *${organization.name}* успешно создана
ID организации: \`${organization.id}\``,
		),
		{
			parse_mode: "MarkdownV2",
			reply_markup: toAdminMenuKeyboard("В панель администратора"),
		},
	);
};
