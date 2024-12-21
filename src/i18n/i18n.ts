import i18n from 'i18n';
import EsTranslation from './locales/es.json' with { type: 'json' };
import EnTranslation from './locales/en.json' with { type: 'json' };

i18n.configure({
	locales: ['es', 'en'],
	defaultLocale: 'es',
	staticCatalog: {
		es: EsTranslation,
		en: EnTranslation,
	},
	objectNotation: true,
});

export { i18n };
