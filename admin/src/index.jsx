export default {
    register(app) {
        app.customFields.register({
            name: 'title',
            type: 'string',
            pluginId: 'bold-title-editor',
            intlLabel: {
                id: 'bold-title-editor.label',
                defaultMessage: 'Bold title editor'
            },
            intlDescription: {
                id: 'bold-title-editor.description',
                defaultMessage: 'A bold title/text editor to accent certain parts'
            },
            components: {
                Input: async () => import(/* webpackChunkName: "input-component" */ './components/Input')
            }
        });
    },
    async registerTrads({ locales }) {
        const importedTrads = await Promise.all(
            locales.map((locale) => {
                return import(`./translations/${locale}.json`)
                    .then(({ default: data }) => {
                        return {
                            data,
                            locale
                        };
                    })
                    .catch(() => {
                        return {
                            data: {},
                            locale
                        };
                    });
            })
        );

        return Promise.resolve(importedTrads);
    }
};
