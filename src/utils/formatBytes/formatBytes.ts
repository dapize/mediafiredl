export const formatBytes = (bytes: number): string => {
	const kSize = 1024;
	const sizes = [
		'Bytes',
		'KiB',
		'MiB',
		'GiB',
		'TiB',
		'PiB',
		'EiB',
		'ZiB',
		'YiB',
	];
	const indexSize = Math.floor(Math.log(bytes) / Math.log(kSize));
	const calc = bytes / Math.pow(kSize, indexSize);
	return `${parseFloat(calc.toString()).toFixed(2)} ${sizes[indexSize]}`;
};
