import { Context } from "grammy";
import { toMainMenu } from "./routes/toMenus";
import { Conversation } from "@grammyjs/conversations";
import { getInfoById, getQuestionsDB, gettAllInfo } from "./prisma/db";
import { questionKeyboard } from "./inline_keyboards/questionsKeyboard";
import { Prisma } from "@prisma/client";
import { infoBlockMenu } from "./inline_keyboards/infoBlockMenu";
import { api, MyConversation } from "./bot";

export const delay = async (ms: number) =>
	new Promise((res) => setTimeout(res, ms));

export const checkForCancel = async (
	ctx: Context,
	conversation: MyConversation,
	route: Function,
	message?: string,
) => {
	if (ctx.hasCallbackQuery("cancel")) {
		ctx.answerCallbackQuery("Отменено");
		conversation.halt();
		route(ctx);
	} else {
		if (message) ctx.reply(message);
	}
};

export function isCommaSeparatedWords(input: string): boolean {
	if (typeof input !== "string") {
		return false;
	}

	const trimmedInput = input.trim();
	if (trimmedInput === "") {
		return false;
	}

	const words = trimmedInput.split(",");

	// Проверяем, что элементов больше одного (минимум одна запятая и два слова)
	if (words.length < 2) {
		return false;
	}

	for (let word of words) {
		const trimmedWord = word.trim();
		if (trimmedWord === "") {
			return false;
		}
		if (!/^[a-zA-Zа-яА-Я0-9\W_]+$/.test(trimmedWord)) {
			return false;
		}
	}

	return true;
}

export function splitCommaSeparatedString(input: string): string[] {
	// Проверяем, что входные данные являются строкой
	if (typeof input !== "string") {
		return [];
	}

	// Убираем пробелы в начале и конце строки
	const trimmedInput = input.trim();

	// Если строка пустая, возвращаем пустой массив
	if (trimmedInput === "") {
		return [];
	}

	// Разделяем строку по запятым и убираем пробелы вокруг каждого элемента
	const elements = trimmedInput
		.split(",")
		.map((element) => element.trim())
		.filter((element) => element !== "");
	// Возвращаем массив элементов
	return elements;
}

export const sendQuestion = async (
	question: Prisma.QuestionGetPayload<{ include: { answers: true } }>,
	userId: number,
	addButtons: boolean = false,
) => {
	const text = question.text;
	const photo = question.photo;
	let message = text;
	if (question.infoBlockId) {
		const infoBlock = await getInfoById(question.infoBlockId);
		const message = `Вопрос для информационного блока номер ${
			infoBlock!.order
		}\n\n${text}`;
	}
	if (photo) {
		await api.sendPhoto(userId!, photo, {
			caption: message,
			reply_markup: questionKeyboard(question, addButtons),
		});
		// await ctx.replyWithPhoto(photo, {
		// 	caption: message,
		// 	reply_markup: questionKeyboard(question),
		// });
	} else {
		await api.sendMessage(userId!, message, {
			reply_markup: questionKeyboard(question, addButtons),
		});
		// await ctx.reply(message, {
		// 	reply_markup: questionKeyboard(question),
		// });
	}
};

export const sendQuestions = async (ctx: Context) => {
	const questions = await getQuestionsDB();
	if (questions.length === 0) {
		ctx.reply("Нет вопросов");
		return;
	}
	for (const question of questions) {
		await sendQuestion(question, ctx.chat!.id);
		await delay(300);
	}
};

export function shuffleArray<T>(array: T[]): T[] {
	// Создаем копию массива, чтобы не изменять оригинальный массив
	const shuffledArray = [...array];

	// Проходим по массиву с конца к началу
	for (let i = shuffledArray.length - 1; i > 0; i--) {
		// Генерируем случайный индекс от 0 до i
		const j = Math.floor(Math.random() * (i + 1));

		// Меняем местами элементы shuffledArray[i] и shuffledArray[j]
		[shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
	}

	return shuffledArray;
}

export const sendInfoBlock = async (
	infoBlock: Prisma.InfoBlockGetPayload<{
		include: { questions: { include: { answers: true } } };
	}>,
	ctx: Context,
	addMenus: boolean,
) => {
	const text = infoBlock.text;
	let message;
	addMenus
		? (message = `Информационный блок номер ${infoBlock.order}\n\n${text}`)
		: (message = text);
	const photo = infoBlock.photo;
	if (photo) {
		await ctx.replyWithPhoto(photo, {
			caption: message,
			reply_markup: addMenus ? infoBlockMenu(infoBlock) : undefined,
		});
	} else if (infoBlock.video) {
		await ctx.replyWithVideo(infoBlock.video, {
			caption: message,
			reply_markup: addMenus ? infoBlockMenu(infoBlock) : undefined,
		});
	} else {
		await ctx.reply(message, {
			reply_markup: addMenus ? infoBlockMenu(infoBlock) : undefined,
		});
	}
	const questions = infoBlock.questions;
	for (const question of questions) {
		await sendQuestion(question, ctx.chat!.id, addMenus);
	}
};

export const sendInfo = async (ctx: Context) => {
	const infoBlocks = await gettAllInfo();

	if (infoBlocks.length === 0) {
		ctx.reply("Нет информации");
		return;
	}

	for (const infoBlock of infoBlocks) {
		await sendInfoBlock(infoBlock, ctx, true);
		await delay(300);
	}
};

export function generateRandomDigits(length: number = 6): string {
	let result = "";
	for (let i = 0; i < length; i++) {
		result += Math.floor(Math.random() * 10); // Генерация случайной цифры от 0 до 9
	}
	return result;
}

interface ProcessResult<T> {
	item: T;
	status: "success" | "error";
	result?: string; // Результат выполнения функции (если успех)
	error?: string; // Сообщение об ошибке (если ошибка)
}

export async function processArrayAsync<T>(
	array: T[],
	someAsyncFunction: (item: T) => Promise<any>,
): Promise<ProcessResult<T>[]> {
	// Создаем массив промисов
	const promises = array.map(async (item) => {
		try {
			const result = await someAsyncFunction(item); // Выполняем асинхронную функцию
			return { item, status: "success" } as ProcessResult<T>; // Возвращаем информацию об успехе
		} catch (error) {
			return {
				item,
				status: "error",
				error: (error as Error).message,
			} as ProcessResult<T>; // Возвращаем информацию об ошибке
		}
	});

	// Ждем завершения всех промисов
	const results = await Promise.all(promises);
	return results;
}

export function calculateDuration(
	actionDurationMs: number,
	actionCount: number,
): string {
	// Вычисляем общую продолжительность в миллисекундах
	const totalDurationMs = actionDurationMs * actionCount;

	// Переводим миллисекунды в секунды
	const totalDurationSeconds = Math.floor(totalDurationMs / 1000);

	// Если секунд меньше или равно 60, возвращаем результат в секундах
	if (totalDurationSeconds <= 60) {
		return `${totalDurationSeconds} сек`;
	}

	// Если секунд больше 60, переводим в минуты и секунды
	const minutes = Math.floor(totalDurationSeconds / 60);
	const seconds = totalDurationSeconds % 60;

	return `${minutes} мин ${seconds} сек`;
}

export function escapeMarkdownV2(text: string): string {
	const escapeCharacters: { [key: string]: string } = {
		"*": "\\*",
		_: "\\_",
		"[": "\\[",
		"]": "\\]",
		"(": "\\(",
		")": "\\)",
		"~": "\\~",
		"`": "\\`",
		">": "\\>",
		"#": "\\#",
		"+": "\\+",
		"-": "\\-",
		"=": "\\=",
		"|": "\\|",
		"!": "\\!",
		"{": "\\{",
		"}": "\\}",
		".": "\\.",
	};

	return text.replace(
		/[*_`\[\]()~#+=\|!{}.]/g,
		(match: string) => escapeCharacters[match],
	);
}
