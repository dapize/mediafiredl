export const getOsLanguage = (): string => {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  return locale.split("-")[0];
};
