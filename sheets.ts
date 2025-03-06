import { Prisma } from "@prisma/client";
import { google } from "googleapis";
import { getAllOrganizations, getAllUsers, getUser } from "./prisma/db";
import { delay } from "./serviceFunctions";

const auth = new google.auth.GoogleAuth({
	keyFile: "credentials.json",
	scopes: "https://www.googleapis.com/auth/spreadsheets",
});

const spreadsheetId = "1PpeUNm7DkQYovXwmMvGsR-PbRmGtIcPYu2KoVkhwFis";
const sheets = google.sheets({ version: "v4", auth });

export const addUserToSheets = async (id: number) => {
	const user = await getUser(id);
	console.log(user);
	if (user) {
		await addRowToSheet(
			[
				user.firstName,
				user.phoneNumber,
				user.organization?.name,
				user.organization?.category,
				user.position,
				user.currentInfoBlockOrder,
			],
			"Пользователи",
		);
	}
};

export const addRowToSheet = async (row: any[], sheet: string) => {
	await sheets.spreadsheets.values.append({
		auth,
		spreadsheetId,
		valueInputOption: "USER_ENTERED",
		range: `${sheet}!A:Z`,
		requestBody: { values: [row] },
	});
};

export const isSheetEmpty = async () => {
	const response = await sheets.spreadsheets.values.get({
		auth,
		spreadsheetId,
		range: "Пользователи!A2:A3",
	});

	const result = response.data.values;
	if (!result) {
		return true;
	} else {
		return false;
	}
};

export const clearSheet = async (sheet: string = "Пользователи") => {
	while (!(await isSheetEmpty())) {
		await sheets.spreadsheets.values.clear({
			spreadsheetId,
			range: `${sheet}!A2:Z100`,
		});
	}
};

export const createSheet = async (sheet = "Пользователи") => {
	let data: any[][] = [[]];
	switch (sheet) {
		case "Пользователи":
			const users = await getAllUsers();
			data = users.map((user) => [
				user.firstName,
				"+" + user.phoneNumber?.toString(),
				user.organization?.name,
				user.organization?.category,
				user.position,
				user.currentInfoBlockOrder,
				user.organization?.id,
			]);
			break;
		case "Организации":
			const organizations = await getAllOrganizations();
			data = organizations.map((organization) => [
				organization.name,
				organization.category,
				organization._count.users,
				organization.id,
			]);
			break;
		default:
			break;
	}
	for (let i = 0; i < data.length; i++) {
		await addRowToSheet(data[i], sheet);
		// await delay(150);
	}
	// await addRowToSheet(data, sheet);
};

export const reloadSheet = async (sheet: string = "Пользователи") => {
	await clearSheet(sheet);
	await createSheet(sheet);
	console.log("Sheet reloaded");
};
