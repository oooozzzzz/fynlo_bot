import { Prisma } from "@prisma/client";
import { InlineKeyboard } from "grammy";

export const infoBlockMenu = (
	infoBlock: Prisma.InfoBlockGetPayload<{ include: { questions: false } }>,
) => {
	const infoBlockId = infoBlock.id;
	return new InlineKeyboard()
		.text("Добавить вопрос", `add_question-${infoBlockId}`)
		.row()
		.text("Удалить информационный блок", `delete_info-${infoBlockId}`);
};
