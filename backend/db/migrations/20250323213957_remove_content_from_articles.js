export async function up(knex) {
  await knex.schema.alterTable('articles', (table) => {
    table.dropColumn('content');
  });
}

export async function down(knex) {
  await knex.schema.alterTable('articles', (table) => {
    table.text('content');
  });
}
