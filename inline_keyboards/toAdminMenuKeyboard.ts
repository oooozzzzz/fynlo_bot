import { InlineKeyboard } from "grammy";

export const toAdminMenuKeyboard = (text: string) =>
	new InlineKeyboard().text(text, "adminMenu");
