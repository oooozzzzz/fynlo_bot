import { Context, InputMediaBuilder } from "grammy";
import { toMainMenu } from "./routes/toMenus.js";
import { Conversation } from "@grammyjs/conversations";
import {
	getAllOrganizations,
	getInfoById,
	getQuestionsDB,
	gettAllInfo,
	getUser,
} from "./prisma/db.js";
import { questionKeyboard } from "./inline_keyboards/questionsKeyboard.js";
import { Prisma } from "@prisma/client";
import { infoBlockMenu } from "./inline_keyboards/infoBlockMenu.js";
import { api, MyConversation } from "./bot.js";
import { MessageEntity, ParseMode } from "grammy/types";

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
	userId: string,
	addButtons: boolean = false,
	parse_mode: ParseMode = "MarkdownV2",
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
			parse_mode: parse_mode ? parse_mode : undefined,
		});
		// await ctx.replyWithPhoto(photo, {
		// 	caption: message,
		// 	reply_markup: questionKeyboard(question),
		// });
	} else {
		await api.sendMessage(userId!, message, {
			reply_markup: questionKeyboard(question, addButtons),
			parse_mode: parse_mode ? parse_mode : undefined,
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
		await sendQuestion(question, ctx.chat!.id.toString());
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
	parse_mode: ParseMode = "MarkdownV2",
) => {
	const text = infoBlock.text;
	let message;
	addMenus
		? (message = `Информационный блок номер ${infoBlock.order}\n\n${text}`)
		: (message = text);
	const photo = infoBlock.photo;
	const parsedPhoto = JSON.parse(photo!);
	console.log(parsedPhoto);
	if (parsedPhoto) {
		const media = parsedPhoto.map((photoid: string) =>
			InputMediaBuilder.photo(photoid),
		);
		try {
			await api.sendMediaGroup(ctx.chat!.id.toString(), media);
			return;
		} catch (error) {
			console.error(error);
		}
	}
	if (photo && !parsedPhoto) {
		await ctx.replyWithPhoto(photo, {
			caption: message,
			reply_markup: addMenus ? infoBlockMenu(infoBlock) : undefined,
			parse_mode: parse_mode ? parse_mode : undefined,
		});
	} else if (infoBlock.video) {
		await ctx.replyWithVideo(infoBlock.video, {
			caption: message,
			reply_markup: addMenus ? infoBlockMenu(infoBlock) : undefined,
			parse_mode: parse_mode ? parse_mode : undefined,
		});
	} else {
		await ctx.reply(message, {
			reply_markup: addMenus ? infoBlockMenu(infoBlock) : undefined,
			parse_mode: parse_mode ? parse_mode : undefined,
		});
	}
	const questions = infoBlock.questions;
	for (const question of questions) {
		await sendQuestion(question, ctx.chat!.id.toString(), addMenus);
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
		"[": "\\[",
		"]": "\\]",
		"(": "\\(",
		")": "\\)",
		"~": "\\~",
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
		/[\[\]()~#+=\|!{}.]/g,
		(match: string) => escapeCharacters[match],
	);
}

export const organizationsString = async () => {
	const organizations = await getAllOrganizations();
	const orgs = organizations
		.map(
			(org) =>
				`*${org.name}* (участников: ${org._count.users}) – _${org.category}_, ID: \`${org.id}\``,
		)
		.join("\n");
	return orgs;
};

export class ReminderSystem {
	private users: Map<string, { stage: number; timers: NodeJS.Timeout[] }>;
	private message: string;

	constructor(
		message: string = "foo", // Сообщение для первого напоминания
	) {
		this.message = message || "foo"; // Сообщение для первого напоминания
		this.users = new Map(); // Хранение данных о пользователях
	}

	// Метод для отправки сообщения и запуска таймеров
	sendMessage(userId: string, message: string = "foo"): void {
		// Очищаем предыдущие таймеры, если они есть
		this.clearUserTimers(userId);

		// Сохраняем время отправки сообщения и этап напоминания
		this.users.set(userId, {
			stage: 0, // Этап напоминания (0 - начальный)
			timers: [], // Таймеры для напоминаний
		});

		// Запускаем таймеры для напоминаний
		this.setReminder(userId, 1 * 24 * 60 * 60 * 1000); // Через 1 день
		this.setReminder(userId, 3 * 24 * 60 * 60 * 1000); // Через 3 дня (1 + 2)
		this.setReminder(userId, 7 * 24 * 60 * 60 * 1000); // Через 7 дней (1 + 2 + 4)
	}

	// Метод для установки напоминания
	private setReminder(userId: string, delay: number): void {
		const timer = setTimeout(() => {
			this.sendReminder(userId);
		}, delay);

		// Сохраняем таймер в объекте пользователя
		const user = this.users.get(userId);
		if (user) {
			user.timers.push(timer);
		}
	}

	// Метод для отправки напоминания
	private async sendReminder(userId: string): Promise<void> {
		const user = this.users.get(userId);
		if (!user) return;

		user.stage += 1;
		if (user.stage < 3) {
			await api.sendMessage(userId, this.message);
			console.log(
				`Напоминание ${user.stage} отправлено пользователю ${userId}`,
			);
		} else {
			const user = await getUser(userId);
			await api.sendMessage(
				-1002578844283,
				`Пользователь @${user!.nickname} из организации ${
					user!.organization?.name
				} не продолжил обучение. Телефон пользователя: ${user!.phoneNumber}`,
			);
		}

		// Если это последнее напоминание, удаляем пользователя из системы
		if (user.stage === 3) {
			this.clearUser(userId);
		}
	}

	// Метод для обработки ответа пользователя
	handleUserResponse(userId: string, responseMessage?: string): void {
		// Очищаем текущие таймеры
		this.clearUserTimers(userId);

		// Отправляем новое сообщение и устанавливаем новые таймеры
		this.sendMessage(userId);
	}

	// Метод для очистки таймеров пользователя
	private clearUserTimers(userId: string): void {
		const user = this.users.get(userId);
		if (user) {
			// Очищаем все таймеры
			user.timers.forEach((timer) => clearTimeout(timer));
			user.timers = [];
		}
	}

	// Метод для удаления пользователя из системы
	private clearUser(userId: string): void {
		this.clearUserTimers(userId);
		this.users.delete(userId);
	}
}

// Пример использования
export const reminderSystem = new ReminderSystem();

export interface TextEntity {
	offset: number;
	length: number;
	type: "bold" | "italic" | "underline" | "strikethrough" | "code";
}

export interface FormattedText {
	text: string;
	entities: MessageEntity[];
}

// Экранирует спецсимволы Markdown V2
function escapeMarkdown(text: string): string {
	const specialChars = [
		"_",
		"*",
		"[",
		"]",
		"(",
		")",
		"~",
		"`",
		">",
		"#",
		"+",
		"-",
		"=",
		"|",
		"{",
		"}",
		".",
		"!",
	];
	let escapedText = "";
	for (const char of text) {
		if (specialChars.includes(char)) {
			escapedText += "\\" + char;
		} else {
			escapedText += char;
		}
	}
	return escapedText;
}

// Применяет Markdown-разметку к тексту (учитывает экранирование)
export function applyMarkdownV2({ text, entities }: FormattedText): string {
	// Сначала экранируем весь текст
	let escapedText = escapeMarkdown(text);
	if (!entities) return escapedText;

	// Сортируем сущности в обратном порядке (для корректной вставки)
	const sortedEntities = [...entities].sort((a, b) => b.offset - a.offset);

	let result = escapedText;
	for (const entity of sortedEntities) {
		const { offset, length, type } = entity;
		const start = offset;
		const end = offset + length;

		const selectedText = result.substring(start, end);
		let formattedText = selectedText;

		switch (type) {
			case "bold":
				formattedText = `*${selectedText}*`; // Жирный в MarkdownV2 (Telegram)
				break;
			case "italic":
				formattedText = `_${selectedText}_`; // Курсив
				break;
			case "code":
				formattedText = "`" + selectedText + "`";
				break;
			case "strikethrough":
				formattedText = `~${selectedText}~`;
				break;
			// Другие типы...
			default:
				break;
		}

		// Вставляем форматированный текст
		result = result.substring(0, start) + formattedText + result.substring(end);
	}

	return result;
}
