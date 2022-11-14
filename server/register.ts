import { Strapi } from '@strapi/strapi';

export default ({ strapi }: { strapi: Strapi }) => {
    strapi.customFields.register({
        name: 'title',
        plugin: 'bold-title-editor',
        type: 'string'
    });
};
