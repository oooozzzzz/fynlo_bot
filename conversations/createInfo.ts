import { Conversation } from "@grammyjs/conversations";
import { Context } from "grammy";
import { cancelKeyboard } from "../inline_keyboards/cancelKeyboard";
import { toAdminMenu } from "../routes/toMenus";
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
import { MyConversation } from "../bot";

export const createInfo = async (
	conversation: MyConversation,
	ctx: Context,
) => {
	await ctx.reply("Введите текст информационного блока", {
		reply_markup: cancelKeyboard("Отмена"),
	});

	const text = await conversation.form.text({
		otherwise: (ctx) => checkForCancel(ctx, conversation, toAdminMenu),
	});
	await ctx.reply("Укажите порядок информационного блока", {
		reply_markup: cancelKeyboard("Отмена"),
	});

	const order = await conversation.form.number({
		otherwise: (ctx) =>
			checkForCancel(
				ctx,
				conversation,
				toAdminMenu,
				"Порядковый номер информационного блока должен быть числом",
			),
	});
	await ctx.reply(
		"Отправьте фото или видео, которое будет прикреплено к информационному блоку",
		{
			reply_markup: cancelKeyboard("Пропустить"),
		},
	);
	let photoId = null;
	let videoId = null;

	const media = await conversation.waitUntil(
		(ctx) => {
			return (
				Context.has.filterQuery(":photo")(ctx) ||
				ctx.hasCallbackQuery("cancel") ||
				Context.has.filterQuery(":video")(ctx)
			);
		},
		{
			otherwise: (ctx) => {
				ctx.reply("Отправьте фото либо видео или воспользуйтесь кнопкой");
			},
		},
	);
	if (media.hasCallbackQuery("cancel")) {
		media.answerCallbackQuery();
	} else if (media.message?.photo) {
		photoId = media.message?.photo![0].file_id;
	} else if (media.message?.video) {
		videoId = media.message?.video.file_id;
	}

	const infoBlock = await createInfoDB({
		text,
		order,
		photo: photoId,
		video: videoId,
	});
	if (infoBlock) {
		await ctx.reply("Информационный блок создан");
		infoBlock.photo
			? await ctx.replyWithPhoto(infoBlock.photo, {
					caption: infoBlock.text,
					reply_markup: infoBlockMenu(infoBlock),
			  })
			: infoBlock.video
			? await ctx.replyWithVideo(infoBlock.video, {
					caption: infoBlock.text,
					reply_markup: infoBlockMenu(infoBlock),
			  })
			: await ctx.reply(infoBlock.text, {
					reply_markup: infoBlockMenu(infoBlock),
			  });
	}
};
