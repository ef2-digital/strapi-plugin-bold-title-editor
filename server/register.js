'use strict';

module.exports = ({ strapi }) => {
    strapi.customFields.register({
        name: 'title',
        plugin: 'bold-title-editor',
        type: 'string'
    });
};
