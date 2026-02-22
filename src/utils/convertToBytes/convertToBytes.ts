import { i18n } from "@i18n/i18n.ts";

const unitsToBytes: Record<string, number> = {
	B: 1,
	KB: 1024,
	MB: 1024 ** 2,
	GB: 1024 ** 3,
	TB: 1024 ** 4,
};

export const convertToBytes = (measurement: string) => {
	const regex = /([0-9.]+)([A-Za-z]+)/;
	const match = measurement.match(regex);
	if (!match) {
		throw new Error(i18n.__("errors.invalidformat", { measurement }));
	}
	const value = parseFloat(match[1]);
	const unit = match[2].toUpperCase();
	if (!unitsToBytes[unit]) {
		throw new Error(i18n.__("errors.invalidUnit", { unit }));
	}
	return value * unitsToBytes[unit];
};
