import { Conversation } from "@grammyjs/conversations";
import { Context, Keyboard } from "grammy";
import { checkForCancel, delay } from "../serviceFunctions";
import { toMainMenu } from "../routes/toMenus";
import { get } from "http";
import {
	createUser,
	getOrganizationDB,
	organizationExists,
	sendNextInfoBlock,
} from "../prisma/db";

export const createUserConversation = async (
	conversation: Conversation,
	ctx: Context,
) => {
	await ctx.reply("Как к Вам обращаться?");
	const name = await conversation.form.text({
		otherwise: (ctx) => ctx.reply("Пожалуйста, напишите имя"),
	});
	await ctx.reply("Введите номер телефона", {
		reply_markup: new Keyboard()
			.requestContact("Отправить номер телефона")
			.resized(true)
			.oneTime(true),
	});
	const contact = await conversation.form.contact({
		otherwise: (ctx) => ctx.reply("Пожалуйста, напишите номер телефона"),
	});
	await ctx.reply("Введите уникальный код организации", {
		reply_markup: { remove_keyboard: true },
	});

	const organizationId = await conversation.waitUntil(
		async (ctx) => {
			const message = ctx.message?.text;
			if (message == "!!") return true;
			const organization = await organizationExists(Number(message!));
			console.log(organization);
			if (organization) {
				return true;
			} else return false;
		},
		{
			otherwise: (ctx) =>
				ctx.reply("Пожалуйста, перепроверьте код. Организация не найдена"),
		},
	);
	const organization = await getOrganizationDB(
		Number(organizationId.message!.text!),
	);

	if (organizationId.message?.text == "!!") {
		await ctx.reply(
			"Добро пожаловать! Используйте команды, чтобы наполнить бота контентом",
		);
		await createUser({
			id: ctx.from!.id,
			phoneNumber: contact.phone_number!,
			firstName: name,
			position: "Администратор бота",
		});
		return await conversation.halt();
	}

	organization &&
		(await ctx.reply(`Выбрана организация: ${organization.name}`));
	await ctx.reply("Какую должность Вы занимаете?");

	const position = await conversation.form.text();
	const user = await createUser({
		id: ctx.from!.id,
		phoneNumber: contact.phone_number!,
		firstName: name,
		organization: { connect: { id: Number(organizationId.message!.text!) } },
		position,
	});
	if (user) {
		await ctx.reply(
			"Супер, спасибо! В течение 14 дней будем направлять вам информацию. \n\nА сейчас - первый вводный блок",
		);
		await delay(3500);
		sendNextInfoBlock(user.id);
	}
};
