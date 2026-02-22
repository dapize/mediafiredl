import i18n from "i18n";

import { getOsLanguage } from "@utils/getOsLanguage/index.ts";

import EnTranslation from "./locales/en.json" with { type: "json" };
import EsTranslation from "./locales/es.json" with { type: "json" };

const locales = ["es", "en"];
i18n.configure({
	locales,
	defaultLocale: "es",
	staticCatalog: {
		es: EsTranslation,
		en: EnTranslation,
	},
	objectNotation: true,
});

const osLanguage = getOsLanguage();
if (locales.includes(osLanguage)) {
	i18n.setLocale(osLanguage);
}

export { i18n };
