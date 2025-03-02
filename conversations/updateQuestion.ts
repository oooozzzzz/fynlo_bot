import { Conversation } from "@grammyjs/conversations";
import { cancelKeyboard } from "../inline_keyboards/cancelKeyboard";
import { checkForCancel, sendQuestions } from "../serviceFunctions";
import { toAdminMenu } from "../routes/toMenus";
import {
	addPhotoToQuestion,
	addQuestionToInfo,
	getInfoByOrder,
	updateQuestionOrder,
} from "../prisma/db";
import { Context } from "grammy";
import { MyConversation, MyConversationContext } from "../bot";

export const updateQuestion = async (
	conversation: MyConversation,
	ctx: MyConversationContext,
	update: string,
	questionId: number,
) => {
	if (update === "order") {
		await ctx.reply("Введите новый порядковый номер вопроса:", {
			reply_markup: cancelKeyboard("Отмена"),
		});
		const order = await conversation.form.number({
			otherwise: (ctx) =>
				checkForCancel(
					ctx,
					conversation,
					toAdminMenu,
					"Порядковый номер вопроса должен быть числом",
				),
		});
		const result = await updateQuestionOrder(questionId, order);
		if (result) {
			await ctx.reply("Порядковый номер вопроса изменен");
		} else {
			await ctx.reply("Произошла ошибка");
		}
	} else if (update === "photo") {
		await ctx.reply("Отправьте фото, которое будет прикреплено к вопросу", {
			reply_markup: cancelKeyboard("Отмена"),
		});
		const photo = await conversation.form.photo({
			otherwise: (ctx) =>
				checkForCancel(
					ctx,
					conversation,
					toAdminMenu,
					"Пожалуйста, отправьте фото",
				),
		});
		const photoId = photo[0].file_id;
		const result = await addPhotoToQuestion(questionId, photoId);
		if (result) {
			await ctx.reply("Фото добавлено");
		} else {
			await ctx.reply("Произошла ошибка");
		}
	} else if (update === "add_to_info") {
		await ctx.reply("Укажите номер информационного блока:");
		const order = await conversation.form.number({
			otherwise: (ctx) =>
				checkForCancel(
					ctx,
					conversation,
					toAdminMenu,
					"Номер информационного блока должен быть числом",
				),
		});
		const info = await getInfoByOrder(order);
		if (info) {
			await addQuestionToInfo(info.id, questionId);
			await ctx.reply("Вопрос добавлен в информационный блок");
		}
	}
	await sendQuestions(ctx);
};
