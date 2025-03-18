import { Prisma } from "@prisma/client";
import { InlineKeyboard } from "grammy";
import { shuffleArray } from "../serviceFunctions.js";

export const questionKeyboard = (
	question: Prisma.QuestionGetPayload<{ include: { answers: true } }>,
	addButtons: boolean = false,
) => {
	const questionId = question.id;
	const answers = question.answers;
	const shuffledAnswers = shuffleArray(answers);
	const buttons = shuffledAnswers.map((answer) => {
		return [
			InlineKeyboard.text(
				answer.text,
				`answer-${questionId}-${answer.id}-${
					answer.isCorrect ? "correct" : "incorrect"
				}`,
			),
		];
	});
	if (!addButtons) return InlineKeyboard.from(buttons);
	buttons.push(
		[InlineKeyboard.text("----------------------------------", `1`)],
		// [InlineKeyboard.text("Изменить порядок", `order_question-${questionId}`)],
		[
			InlineKeyboard.text(
				"Добавить/изменить фото",
				`photo_question-${questionId}`,
			),
		],
		[InlineKeyboard.text("Удалить вопрос", `delete_question-${questionId}`)],
	);
	return InlineKeyboard.from(buttons);
};
