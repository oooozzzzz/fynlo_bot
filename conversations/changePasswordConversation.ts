import { Context, InlineKeyboard } from "grammy";
import { MyContext, MyConversation } from "../bot";
import { cancelKeyboard } from "../inline_keyboards/cancelKeyboard";
import { checkForCancel } from "../serviceFunctions";
import { toAdminMenu, toMainMenu } from "../routes/toMenus";
import { setPassword } from "../prisma/db";
import { adminMenu } from "../interactive_menus/adminMenu";

export const changePasswordConversation = async (
	conversation: MyConversation,
	ctx: Context,
) => {
	await ctx.reply("Введите новый пароль", {
		reply_markup: cancelKeyboard("Отмена"),
	});
	const password = await conversation.form.text({
		otherwise: (ctx) => checkForCancel(ctx, conversation, toAdminMenu),
	});
	const repeat = conversation.checkpoint();
	await ctx.reply("Повторите новый пароль", {
		reply_markup: cancelKeyboard("Отмена"),
	});
	const password2 = await conversation.form.text({
		otherwise: (ctx) => checkForCancel(ctx, conversation, toAdminMenu),
	});
	if (password === password2) {
		await setPassword("1", password);
		return ctx.reply("Пароль изменен", {
			reply_markup: new InlineKeyboard().text(
				"В панель администратора",
				"adminMenu",
			),
		});
		// const adminMenu = conversation.menu("adminMenu");
		// return await ctx.reply("Панель администратора", { reply_markup: adminMenu });
	} else {
		await ctx.reply("Пароли не совпадают");
		await conversation.rewind(repeat);
	}
};
