'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::my-api.my-api', ({ strapi }) => ({
    async customEndpoint(ctx) {
        // Your custom logic here
        ctx.body = 'This is a custom API endpoint!';
    },
}));