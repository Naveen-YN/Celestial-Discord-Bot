const { defineConfig } = require('drizzle-kit');

module.exports = defineConfig({
  dialect: 'postgresql',
  schema: './shared/schema.js',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});