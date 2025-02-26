import { Conversation } from "@grammyjs/conversations";
import { Context } from "grammy";
import { cancelKeyboard } from "../inline_keyboards/cancelKeyboard";
import { toMainMenu } from "../routes/toMenus";
import {
	checkForCancel,
	isCommaSeparatedWords,
	splitCommaSeparatedString,
} from "../serviceFunctions";
import {
	createInfoDB,
	createQuestionsDB,
	getQuestionsCount,
} from "../prisma/db";
import { infoBlockMenu } from "../inline_keyboards/infoBlockMenu";

export const createInfo = async (conversation: Conversation, ctx: Context) => {
	await ctx.reply("Введите текст информационного блока", {
		reply_markup: cancelKeyboard("Отмена"),
	});

	const text = await conversation.form.text({
		otherwise: (ctx) => checkForCancel(ctx, conversation, toMainMenu),
	});
	await ctx.reply("Укажите порядок информационного блока", {
		reply_markup: cancelKeyboard("Отмена"),
	});

	const order = await conversation.form.number({
		otherwise: (ctx) =>
			checkForCancel(
				ctx,
				conversation,
				toMainMenu,
				"Порядковый номер информационного блока должен быть числом",
			),
	});
	await ctx.reply(
		"Отправьте фото, которое будет прикреплено к информационному блоку",
		{
			reply_markup: cancelKeyboard("Пропустить"),
		},
	);
	let photoId;
	const photo = await conversation.waitUntil((ctx) => {
		return (
			Context.has.filterQuery(":photo")(ctx) || ctx.hasCallbackQuery("cancel")
		);
	});
	if (photo.hasCallbackQuery("cancel")) {
		photoId = null;
		photo.answerCallbackQuery();
	} else {
		photoId = photo.message?.photo![0].file_id;
	}
	const infoBlock = await createInfoDB({ text, order, photo: photoId });
	if (infoBlock) {
		await ctx.reply("Информационный блок создан");
		infoBlock.photo
			? await ctx.replyWithPhoto(infoBlock.photo, {
					caption: infoBlock.text,
					reply_markup: infoBlockMenu(infoBlock),
			  })
			: await ctx.reply(infoBlock.text, {
					reply_markup: infoBlockMenu(infoBlock),
			  });
	}
};
