export const convertMsToTime = (ms: number) => {
	let seconds: number | string = Math.floor(ms / 1000);
	let minutes: number | string = Math.floor(seconds / 60);
	let hours: number | string = Math.floor(minutes / 60);
	seconds = seconds % 60;
	minutes = minutes % 60;
	hours = hours % 24;
	seconds = seconds.toString().padStart(2, '0');
	minutes = minutes.toString().padStart(2, '0');
	hours = hours.toString().padStart(2, '0');
	return `${hours}:${minutes}:${seconds}`;
};
