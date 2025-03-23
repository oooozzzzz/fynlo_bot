import { Menu, MenuRange } from "@grammyjs/menu";
import { MyContext } from "../bot.js";
import { Context } from "grammy";
import {
	getAllOrganizations,
	getAllUsers,
	getOrganizationDB,
	getUsersByCategory,
	getUsersCount,
} from "../prisma/db.js";
import {
	escapeMarkdownV2,
	organizationsString,
	sendInfo,
} from "../serviceFunctions.js";
import { reloadAllSheets, reloadSheet } from "../sheets.js";

export const adminMenu = new Menu<MyContext>("adminMenu")
	.text("Информация", async (ctx) => {
		ctx.menu.nav("infoMenu");
	})
	.row()
	.text("Отправить рассылку", async (ctx) => {
		ctx.menu.nav("sendOutMenu");
	})
	.row()
	.text("Управление контентом", async (ctx) => {
		ctx.menu.nav("contentMenu");
	})
	.row()
	.text("Сменить пароль", async (ctx) => {
		await ctx.conversation.enter("changePasswordConversation");
	})
	.row()
	.text("Закрыть", async (ctx) => {
		ctx.msg?.delete();
	});

const sendOutMenu = new Menu<MyContext>("sendOutMenu")
	.text(
		async () => `Отправить всем (${await getUsersCount()})`,
		async (ctx) => {
			const users = await getAllUsers();
			const userIds = users.map((user) => user.id);
			await ctx.conversation.enter("sendOutConversation", userIds);
		},
	)
	.row()
	.text("Отправить нише", async (ctx) => {
		ctx.menu.nav("categoriesMenu");
		await ctx.answerCallbackQuery("Выберите нишу");
	})
	.row()
	.text("Отправить организации", async (ctx) => {
		await ctx.conversation.enter("sendToOrganization");
	})
	.row()
	.text("Отправить вопрос", async (ctx) => {
		await ctx.conversation.enter("sendOutQuestion");
	})
	.row()
	.text("Назад", async (ctx) => {
		ctx.menu.back();
	});

const categoriesMenu = new Menu<MyContext>("categoriesMenu")
	.dynamic(() => {
		// Generate a part of the menu dynamically!
		const range = new MenuRange<MyContext>();
		const categories = ["Спа/клиники", "Спорт/велнес", "Частники"];
		categories.forEach((category) =>
			range
				.text(category, async (ctx) => {
					const users = await getUsersByCategory(category);
					if (users.length == 0 || !users)
						return await ctx.reply("В этой нише пока нет пользователей");
					const userIds = users.map((user) => user.id);
					await ctx.conversation.enter("sendOutConversation", userIds);
				})
				.row(),
		);
		return range;
	})
	.text("Назад", async (ctx) => {
		ctx.menu.back();
	});

const contentMenu = new Menu<MyContext>("contentMenu")
	.text("Показать инфоблоки", async (ctx) => {
		await sendInfo(ctx);
	})
	.row()
	.text("Добавить информационный блок", async (ctx) => {
		await ctx.conversation.enter("createInfo");
	})
	.row()
	.text("Добавить организацию", async (ctx) => {
		await ctx.conversation.enter("createOrganization");
	})
	.row()
	.text("Показать организации", async (ctx) => {
		const organizations = await organizationsString();
		ctx.replyWithMarkdownV2(escapeMarkdownV2(organizations));

		await ctx.msg?.delete();
		await ctx.reply("Панель администратора", { reply_markup: contentMenu });
	})
	.row()
	.text("Назад", async (ctx) => {
		ctx.menu.back();
	});

export const infoMenu = new Menu<MyContext>("infoMenu")
	.text("Обновить информацию", async (ctx) => {
		ctx.reply(
			"Информация начала обновляться. Это может занять некоторое время",
		);
		reloadAllSheets();
	})
	.row()
	.url(
		"Информация",
		"https://docs.google.com/spreadsheets/d/1PpeUNm7DkQYovXwmMvGsR-PbRmGtIcPYu2KoVkhwFis/edit?gid=0#gid=0",
	)
	.row()
	.text("Назад", async (ctx) => {
		ctx.menu.back();
	});

adminMenu.register([sendOutMenu, infoMenu, contentMenu]);
adminMenu.register(categoriesMenu, "sendOutMenu");
