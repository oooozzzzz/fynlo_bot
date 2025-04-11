import { Conversation } from "@grammyjs/conversations";
import { Context, InputMediaBuilder } from "grammy";
import { cancelKeyboard } from "../inline_keyboards/cancelKeyboard.js";
import { toAdminMenu } from "../routes/toMenus.js";
import {
	applyMarkdownV2,
	checkForCancel,
	isCommaSeparatedWords,
	splitCommaSeparatedString,
	TextEntity,
} from "../serviceFunctions.js";
import {
	createInfoDB,
	createQuestionsDB,
	getQuestionsCount,
} from "../prisma/db.js";
import { infoBlockMenu } from "../inline_keyboards/infoBlockMenu.js";
import { MyConversation } from "../bot.js";
import { InputFile, InputMediaPhoto, MessageEntity } from "grammy/types";

export const createInfo = async (
	conversation: MyConversation,
	ctx: Context,
) => {
	await ctx.reply("Введите текст информационного блока", {
		reply_markup: cancelKeyboard("Отмена"),
	});
	let entities: MessageEntity[] | undefined = [];
	const text = await conversation.form.text({
		otherwise: (ctx) => checkForCancel(ctx, conversation, toAdminMenu),
		action: (ctx) => {
			entities = ctx.message?.entities;
		},
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
		text: applyMarkdownV2({ text, entities }),
		order,
		photo: JSON.stringify([photoId]),
		video: videoId,
	});
	if (infoBlock) {
		await ctx.reply("Информационный блок создан");
		JSON.parse(infoBlock.photo!)[0]
			? await ctx.replyWithPhoto(JSON.parse(infoBlock.photo!)[0], {
					caption: infoBlock.text,
					reply_markup: infoBlockMenu(infoBlock),
					parse_mode: "MarkdownV2",
			  })
			: infoBlock.video
			? await ctx.replyWithVideo(infoBlock.video, {
					caption: infoBlock.text,
					reply_markup: infoBlockMenu(infoBlock),
					parse_mode: "MarkdownV2",
			  })
			: await ctx.reply(infoBlock.text, {
					reply_markup: infoBlockMenu(infoBlock),
					parse_mode: "MarkdownV2",
			  });
	}
};

export const createMediaGroupInfo = async (
	conversation: MyConversation,
	ctx: Context,
) => {
	await ctx.reply("Сколько фото или видео в медиагруппе?", {
		reply_markup: cancelKeyboard("Отмена"),
	});
	const count = await conversation.form.number({
		otherwise: (ctx) =>
			checkForCancel(
				ctx,
				conversation,
				toAdminMenu,
				"Количество фото или видео в медиагруппе должно быть числом",
			),
	});

	await ctx.reply(
		"Пришлите медиагруппу, которую хотите добавить в качестве инфоблока",
		{
			reply_markup: cancelKeyboard("Отмена"),
		},
	);
	let photos: string[] = [];
	for (let i = 0; i < count; i++) {
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
					ctx.reply("Отправьте медиагруппу или воспользуйтесь кнопкой");
				},
			},
		);

		console.log(photos);

		if (media.hasCallbackQuery("cancel")) {
			media.answerCallbackQuery();
		} else if (media.message?.photo) {
			photos.push(media.message?.photo![0].file_id!);
		}
	}

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
	const infoBlock = await createInfoDB({
		text: "",
		order,
		photo: JSON.stringify(photos),
	});
	if (infoBlock) {
		await ctx.reply("Информационный блок создан");
		const photos: string[] = JSON.parse(infoBlock.photo!);
		const media = photos.map((path) => InputMediaBuilder.photo(path));
		await ctx.replyWithMediaGroup(media);
		// await ctx.api.sendMediaGroup(ctx.chat?.id!, media);
	}
};
