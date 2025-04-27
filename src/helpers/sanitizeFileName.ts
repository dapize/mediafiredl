const truncate = (sanitized: string, length: number): string => {
	const uint8Array = new TextEncoder().encode(sanitized);
	const truncated = uint8Array.slice(0, length);
	return new TextDecoder().decode(truncated);
};

const illegalRe = /[\/\?<>\\:\*\|":]/g;
// deno-lint-ignore no-control-regex
const controlRe = /[\x00-\x1f\x80-\x9f]/g;
const reservedRe = /^\.+$/;
const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;

export const sanitizeFileName = (input: string) => {
	const replacement = '';
	const sanitized = input
		.replace(illegalRe, replacement)
		.replace(controlRe, replacement)
		.replace(reservedRe, replacement)
		.replace(windowsReservedRe, replacement);
	return truncate(sanitized, 255);
};
