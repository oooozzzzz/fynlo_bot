import { Prisma } from "@prisma/client";
import { google } from "googleapis";
import { getUser } from "./prisma/db";

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
