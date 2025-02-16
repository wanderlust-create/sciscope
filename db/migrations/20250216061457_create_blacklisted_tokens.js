export function up(knex) {
  return knex.schema.createTable('blacklisted_tokens', (table) => {
    table.increments('id').primary();
    table.string('token').notNullable().unique();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists('blacklisted_tokens');
}
