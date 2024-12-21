import Bold from './icons/Bold';
import { Initializer } from './components/Initializer';
import { PLUGIN_ID } from './pluginId';

export default {
  register(app: any) {
    app.customFields.register({
      name: 'bold-title',
      type: 'string',
      pluginId: 'bold-title-editor',
      icon: Bold,
      intlLabel: {
        id: 'bold-title-editor.label',
        defaultMessage: 'Bold title editor',
      },
      intlDescription: {
        id: 'bold-title-editor.description',
        defaultMessage: 'A bold title/text editor to accent certain parts',
      },
      components: {
        Input: async () =>
          import(/* webpackChunkName: "bold-title-input-component" */ './components/Input'),
      },
      options: {
        base: [
          {
            intlLabel: {
              id: 'bold-title-editor.options.base.output',
              defaultMessage: 'Output',
            },
            description: {
              id: 'bold-title-editor.options.base.output.description',
              defaultMessage: 'Choose output of plugin',
            },
            name: 'options.output',
            type: 'select',
            defaultValue: 'HTML',
            options: [
              {
                key: 'html',
                value: 'html',
                metadatas: {
                  intlLabel: {
                    id: 'bold-title-editor.options.base.output.html',
                    defaultMessage: 'HTML',
                  },
                },
              },
              {
                key: 'markdown',
                value: 'markdown',
                metadatas: {
                  intlLabel: {
                    id: 'bold-title-editor.options.base.output.markdown',
                    defaultMessage: 'Markdown',
                  },
                },
              },
            ],
          },
        ],
        advanced: [
          {
            sectionTitle: {
              id: 'global.settings',
              defaultMessage: 'Settings',
            },
            items: [
              {
                name: 'required',
                type: 'checkbox',
                intlLabel: {
                  id: 'bold-title-editor.options.advanced.requiredField',
                  defaultMessage: 'Required field',
                },
                description: {
                  id: 'bold-title-editor.options.advanced.requiredField.description',
                  defaultMessage: "You won't be able to create an entry if this field is empty",
                },
              },
            ],
          },
        ],
      },
    });
    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });
  },

  async registerTrads({ locales }: { locales: string[] }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await import(`./translations/${locale}.json`);

          return { data, locale };
        } catch {
          return { data: {}, locale };
        }
      })
    );
  },
};
