import { InlineKeyboard } from "grammy";

export const cancelKeyboard = (text: string) =>
	new InlineKeyboard().text(text, "cancel");
