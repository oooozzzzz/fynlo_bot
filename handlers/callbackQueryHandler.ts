import { Context } from "grammy";
import { deleteInfoBlock, deleteQuestion } from "../prisma/db.js";
import { handleAnswer } from "./handleAsnwer.js";
import { updateQuestion } from "../conversations/updateQuestion.js";
import { MyContext } from "../bot.js";
import { sendQuestions } from "../serviceFunctions.js";

export const callbackQueryHandler = async (ctx: MyContext) => {
	const query = ctx.callbackQuery?.data!;
	const data = query?.split("-");
	const event = data[0];
	switch (event) {
		case "delete_question":
			await ctx.deleteMessage();
			await deleteQuestion(parseInt(data[1]));
			await ctx.answerCallbackQuery("Вопрос удален");
			return;
			break;
		case "answer":
			await handleAnswer(ctx, data);
			break;
		case "order_question":
			await ctx.conversation.enter(
				"updateQuestion",
				"order",
				parseInt(data[1]),
			);
			break;
		case "photo_question":
			await ctx.conversation.enter(
				"updateQuestion",
				"photo",
				parseInt(data[1]),
			);
			break;
		case "add_question":
			await ctx.conversation.enter(
				"addQuestionConversation",
				parseInt(data[1]),
			);
			break;
		case "delete_info":
			await deleteInfoBlock(parseInt(data[1]));
			await ctx.deleteMessage();
			await ctx.answerCallbackQuery("Информационный блок удален");
			break;
		case "question":
			await ctx.conversation.enter("answerQuestion", parseInt(data[1]));
			break;
		default:
			break;
	}
	ctx.answerCallbackQuery();
};
