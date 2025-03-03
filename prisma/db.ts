import { Prisma, PrismaClient } from "@prisma/client";
import { api } from "../bot";
import { sendQuestion } from "../serviceFunctions";
import {
	ForceReply,
	InlineKeyboardMarkup,
	ReplyKeyboardMarkup,
	ReplyKeyboardRemove,
} from "grammy/types";
import { InlineKeyboard } from "grammy";

export const prisma = new PrismaClient();

export const createQuestionsDB = async (
	text: string,
	order: number,
	answers: Prisma.AnswerCreateManyQuestionInput[],
) => {
	try {
		await prisma.question.updateMany({
			where: {
				order: {
					gte: order,
				},
			},
			data: {
				order: {
					increment: 1,
				},
			},
		});

		// Вставляем новый элемент на нужную позицию
		const question = await prisma.question.create({
			data: { text, order, answers: { createMany: { data: answers } } },
		});
		return question;
	} catch (error) {
		console.log(error);
		return false;
	}
};

export const createUser = async (data: Prisma.UserCreateInput) => {
	const user = await prisma.user.findUnique({ where: { id: data.id } });
	if (user) return await prisma.user.update({ where: { id: data.id }, data });

	const userUpdated = await prisma.user.create({ data });
	console.log("User created");
	return userUpdated;
};

export const deleteUser = async (id: number) => {
	try {
		const user = await prisma.user.delete({ where: { id } });
		console.log("User deleted");
		return user;
	} catch (error) {
		console.log(error);
		return false;
	}
};

export const getUser = async (id: number) =>
	await prisma.user.findUnique({
		where: { id },
		include: { organization: true },
	});

export const getQuestionsDB = async () =>
	await prisma.question.findMany({
		orderBy: { order: "asc" },
		include: { answers: true },
	});

export async function updateQuestionOrder(
	itemId: number,
	newOrder: number,
): Promise<boolean> {
	// Находим текущий элемент
	const currentItem = await prisma.question.findUnique({
		where: { id: itemId },
	});

	if (!currentItem) {
		throw new Error("Item not found");
	}

	const oldOrder = currentItem.order;

	// Если порядковый номер не изменился, ничего не делаем
	if (oldOrder === newOrder) {
		return true;
	}
	try {
		// Определяем направление сдвига
		if (newOrder < oldOrder) {
			// Сдвигаем элементы вверх (увеличиваем их порядковые номера на 1)
			await prisma.question.updateMany({
				where: {
					order: {
						gte: newOrder,
						lt: oldOrder,
					},
				},
				data: {
					order: {
						increment: 1,
					},
				},
			});
		} else {
			// Сдвигаем элементы вниз (уменьшаем их порядковые номера на 1)
			await prisma.question.updateMany({
				where: {
					order: {
						gt: oldOrder,
						lte: newOrder,
					},
				},
				data: {
					order: {
						decrement: 1,
					},
				},
			});
		}
		await prisma.question.update({
			where: { id: itemId },
			data: { order: newOrder },
		});
		return true;
	} catch (error) {
		console.log(error);
		return false;
	}
}

async function normalizeOrder() {
	const items = await prisma.question.findMany({
		orderBy: { order: "asc" },
	});

	for (let i = 0; i < items.length; i++) {
		await prisma.question.update({
			where: { id: items[i].id },
			data: { order: i + 1 },
		});
	}
}

export const deleteQuestion = async (itemId: number) => {
	try {
		const itemToDelete = await prisma.question.findUnique({
			where: { id: itemId },
		});

		if (!itemToDelete) {
			throw new Error("Item not found");
		}

		const orderToDelete = itemToDelete.order;

		// Удаляем элемент
		await prisma.question.delete({
			where: { id: itemId },
		});

		// Сдвигаем порядковые номера всех элементов, которые были после удаленного элемента
		await prisma.question.updateMany({
			where: {
				order: {
					gt: orderToDelete,
				},
			},
			data: {
				order: {
					decrement: 1,
				},
			},
		});
		await normalizeOrder();
		return true;
	} catch (error) {
		console.log(error);
		return false;
	}
};

export const getQuestionsCount = async () => await prisma.question.count();

export const addPhotoToQuestion = async (
	questionId: number,
	photoId: string,
) => {
	const question = await prisma.question.findUnique({
		where: { id: questionId },
	});
	if (!question) return false;

	await prisma.question.update({
		where: { id: questionId },
		data: {
			photo: photoId,
		},
	});

	return true;
};

export const createInfoDB = async (data: Prisma.InfoBlockCreateInput) => {
	try {
		await prisma.infoBlock.updateMany({
			where: {
				order: {
					gte: data.order,
				},
			},
			data: {
				order: {
					increment: 1,
				},
			},
		});

		// Вставляем новый элемент на нужную позицию

		const infoBlock = await prisma.infoBlock.create({ data });
		return infoBlock;
	} catch (error) {
		console.log(error);
		return false;
	}
};

export const addQuestionToInfo = async (infoId: number, questionId: number) => {
	const question = await prisma.question.findUnique({
		where: { id: questionId },
	});
	if (!question) return false;

	await prisma.infoBlock.update({
		where: { id: infoId },
		data: {
			questions: {
				connect: {
					id: questionId,
				},
			},
		},
	});
};

export const getInfoByOrder = async (order: number) => {
	const question = await prisma.infoBlock.findUnique({
		where: { order },
	});
	return question;
};

export const gettAllInfo = async () =>
	await prisma.infoBlock.findMany({
		orderBy: { order: "asc" },
		include: { questions: { include: { answers: true } } },
	});

export const getInfoById = async (infoBlockId: number) => {
	const info = await prisma.infoBlock.findUnique({
		where: { id: infoBlockId },
	});
	return info;
};

export const deleteInfoBlock = async (infoBlockId: number) => {
	try {
		const infoToDelete = await prisma.infoBlock.findUnique({
			where: { id: infoBlockId },
		});

		if (!infoToDelete) {
			throw new Error("Item not found");
		}

		const orderToDelete = infoToDelete.order;

		// Удаляем элемент
		await prisma.infoBlock.delete({
			where: { id: infoBlockId },
		});

		// Сдвигаем порядковые номера всех элементов, которые были после удаленного элемента
		await prisma.infoBlock.updateMany({
			where: {
				order: {
					gt: orderToDelete,
				},
			},
			data: {
				order: {
					decrement: 1,
				},
			},
		});
		await normalizeOrder();
		return true;
	} catch (error) {
		console.log(error);
		return false;
	}
};

async function sendInfoBlockToUser(
	userId: number,
	infoBlock: Prisma.InfoBlockGetPayload<{ include: { questions: false } }>,
	inlineKeyboard?:
		| InlineKeyboardMarkup
		| ReplyKeyboardMarkup
		| ReplyKeyboardRemove
		| ForceReply
		| undefined,
) {
	// Логика отправки (например, через email, API или WebSocket)
	console.log(`Пользователь ${userId} получает инфоблок`);
	const { photo, video, text } = infoBlock;
	if (photo)
		await api.sendPhoto(userId, photo, {
			caption: text,
			reply_markup: inlineKeyboard,
		});
	if (video)
		await api.sendVideo(userId, video, {
			caption: text,
			reply_markup: inlineKeyboard,
		});
	if (!photo && !video)
		await api.sendMessage(userId, infoBlock.text, {
			reply_markup: inlineKeyboard,
		});

	// Пример: сохраняем в истории отправок
	await prisma.infoBlockHistory.create({
		data: {
			userId,
			infoBlockId: infoBlock.id,
			sentAt: new Date(),
			isResent: true, // Помечаем как повторную отправку
		},
	});
}

export async function sendNextInfoBlock(
	userId: number,
	inlineKeyboard?: InlineKeyboardMarkup,
) {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) return;

	// Находим инфоблок по currentInfoBlockOrder
	const infoBlock = await prisma.infoBlock.findFirst({
		where: { order: user.currentInfoBlockOrder },
	});

	if (!infoBlock) {
		console.log(`Пользователь ${userId} завершил все инфоблоки.`);
		return;
	}

	// Отправляем инфоблок пользователю
	await sendInfoBlockToUser(userId, infoBlock, inlineKeyboard);

	// Обновляем текущий вопрос (начинаем с первого вопроса инфоблока)
	await prisma.user.update({
		where: { id: userId },
		data: { currentQuestionId: null },
	});
}

export async function sendQuestionToUser(
	userId: number,
	question: Prisma.QuestionGetPayload<{ include: { answers: true } }>,
) {
	// Логика отправки (например, через email, API или WebSocket)
	await sendQuestion(question, userId);
	console.log(`Пользователь ${userId} получает вопрос:`, question.text);

	// Сохраняем в истории отправок
	await prisma.questionHistory.create({
		data: {
			userId,
			questionId: question.id,
			sentAt: new Date(),
		},
	});
}

export async function sendNextQuestion(userId: number) {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) return;
	console.log(user);

	// Находим текущий инфоблок
	const infoBlock = await prisma.infoBlock.findFirst({
		where: { order: user.currentInfoBlockOrder },
		include: {
			questions: { orderBy: { order: "asc" }, include: { answers: true } },
		}, // Вопросы сортируем по порядку
	});

	if (!infoBlock) {
		console.log(`Пользователь ${userId} завершил все инфоблоки.`);
		// await api.sendMessage(userId, "Все инфоблоки завершены.");
		return;
	}

	// Находим текущий вопрос
	let currentQuestion;
	if (user.currentQuestionId) {
		// Если текущий вопрос уже задан, ищем следующий
		const questions = infoBlock.questions;
		const currentIndex = questions.findIndex(
			(q) => q.id === user.currentQuestionId,
		);
		currentQuestion = questions[currentIndex + 1]; // Следующий вопрос
	} else {
		// Если текущий вопрос не задан, начинаем с первого
		currentQuestion = infoBlock.questions[0];
	}
	console.log(currentQuestion, "currentQuestion");

	if (!currentQuestion) {
		// Если вопросы закончились, переходим к следующему инфоблоку
		await prisma.user.update({
			where: { id: userId },
			data: {
				currentInfoBlockOrder: { increment: 1 },
				currentQuestionId: null, // Сбрасываем текущий вопрос
			},
		});

		// Отправляем следующий инфоблок
		// await sendDailyInfoBlock(userId);
		await api.sendMessage(
			userId,
			"Все вопросы завершены. Переходим к следующему инфоблоку.",
		);
		await sendNextInfoBlock(
			userId,
			new InlineKeyboard().text("Я все понял(а)!", "nextQuestion"),
		);
		return;
	}

	// Отправляем вопрос пользователю
	await sendQuestionToUser(userId, currentQuestion);

	// Обновляем текущий вопрос
	await prisma.user.update({
		where: { id: userId },
		data: { currentQuestionId: currentQuestion.id },
	});
}

export async function handleAnswerDB(
	userId: number,
	questionId: number,
	answerId: number,
) {
	const MAX_RESEND_COUNT = 3; // Максимальное количество повторов
	// Шаг 1: Проверяем, прошел ли пользователь все инфоблоки
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) return;

	const totalInfoBlocks = await prisma.infoBlock.count(); // Общее количество инфоблоков
	if (user.currentInfoBlockOrder > totalInfoBlocks) {
		console.log(`Пользователь ${userId} уже завершил все инфоблоки.`);
		return;
	}
	// Шаг 1: Находим ответ и проверяем корректность
	const answer = await prisma.answer.findUnique({
		where: { id: answerId },
		include: { question: { include: { InfoBlock: true } } },
	});

	if (!answer || !answer.question) {
		throw new Error("Ответ или вопрос не найден");
	}
	if (answer.question.order !== user.currentInfoBlockOrder) {
		return;
	}

	// Шаг 2: Обновляем данные пользователя
	const updatedUser = await prisma.user.update({
		where: { id: userId },
		data: {
			currentQuestionId: questionId,
			consecutiveWrongAnswers: answer.isCorrect ? 0 : { increment: 1 },
		},
	});

	console.log(updatedUser);

	// Шаг 3: Если ответ правильный, отправляем следующий вопрос
	if (answer.isCorrect) {
		await sendNextQuestion(userId);
	} else {
		// Шаг 4: Если два неправильных ответа подряд
		if (updatedUser.consecutiveWrongAnswers >= 2) {
			const infoBlock = answer.question.InfoBlock;

			if (infoBlock) {
				// Проверяем, не превышено ли максимальное количество повторов
				if (user.infoBlockResendCount >= MAX_RESEND_COUNT) {
					console.log(
						`Пользователь ${userId} достиг максимального количества повторов инфоблока.`,
					);
					return;
				}

				// Шаг 5: Отправляем текущий инфоблок заново
				await api.sendMessage(
					userId,
					"Текст после двух неправильных ответов подряд",
				);
				await sendInfoBlockToUser(
					userId,
					infoBlock,
					new InlineKeyboard().text("Попробовать еще раз", "nextQuestion"),
				);

				// Шаг 6: Обновляем счетчики
				await prisma.user.update({
					where: { id: userId },
					data: {
						consecutiveWrongAnswers: 0,
						currentQuestionId: null,
						lastSentInfoBlockId: infoBlock.id,
						infoBlockResendCount: { increment: 1 }, // Увеличиваем счетчик повторов
					},
				});
			}
		}
	}

	return { isCorrect: answer.isCorrect };
}

export const createOrganizationDB = async (
	data: Prisma.OrganizationCreateInput,
) => {
	try {
		return await prisma.organization.create({ data });
	} catch (error) {}
};

export const getOrganizationDB = async (id: number) => {
	try {
		return await prisma.organization.findUnique({
			where: { id },
			include: { users: { select: { _count: true } } },
		});
	} catch (error) {}
};

export const organizationExists = async (id: number) => {
	const result = await prisma.organization.findUnique({ where: { id } });
	return result;
};

export const clearInfoInUser = async (id: number) => {
	const user = await prisma.user.update({
		where: { id },
		data: { currentInfoBlockOrder: 1, infoBlockResendCount: 0 },
	});
};

export const getPassword = async (id: string) => {
	return await prisma.password.findUnique({ where: { id } });
};

export const setPassword = async (id: string, value: string) => {
	return await prisma.password.update({ where: { id }, data: { value } });
};

export const getUsersCount = async () => {
	return await prisma.user.count();
};

export const getUsersByCategory = async (category: string) => {
	return await prisma.user.findMany({
		where: { organization: { category } },
		select: { id: true },
	});
};

export const getAllOrganizations = async () => {
	return await prisma.organization.findMany({
		include: { _count: { select: { users: true } } },
	});
};

export const getAllUsers = async () => {
	return await prisma.user.findMany();
};
