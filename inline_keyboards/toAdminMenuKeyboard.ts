import { InlineKeyboard } from "grammy";

export const toAdminMenuKeyboard = (text: string) =>
	new InlineKeyboard().text(text, "adminMenu");
export const toMainMenuKeyboard = (text: string) =>
	new InlineKeyboard().text(text, "mainMenu");
