import { MyConversation, MyConversationContext } from "../bot";
import { cancelKeyboard } from "../inline_keyboards/cancelKeyboard";
import { getOrganizationDB } from "../prisma/db";
import { toAdminMenu } from "../routes/toMenus";
import {
	checkForCancel,
	escapeMarkdownV2,
	organizationsString,
} from "../serviceFunctions";
import { sendOutConversation } from "./sendOutConversation";

export const sendToOrganization = async (
	conversation: MyConversation,
	ctx: MyConversationContext,
) => {
	const organizations = await organizationsString();
	await ctx.replyWithMarkdownV2(escapeMarkdownV2(organizations));
	const repeat = conversation.checkpoint();
	await ctx.reply(
		"Пожалуйста, укажите ID организации. Его можно скопировать из текста выше",
		{
			reply_markup: cancelKeyboard("Отмена"),
		},
	);
	const organizationId = await conversation.form.number({
		otherwise: (ctx) =>
			checkForCancel(
				ctx,
				conversation,
				toAdminMenu,
				"Пожалуйста, укажите ID организации - 6 цифр",
			),
	});
	const organization = await getOrganizationDB(organizationId!);
	if (!organization) {
		await ctx.reply("Организация не найдена");
		await conversation.rewind(repeat);
	}
	const users = organization!.users.map((user) => user.id);
	if (users.length === 0) {
		await ctx.reply("У организации нет пользователей");
		await conversation.rewind(repeat);
	}
	await sendOutConversation(conversation, ctx, users);
};
