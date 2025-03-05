export async function up(knex) {
  return knex.schema.alterTable('user_bookmarks', async (table) => {
    // Ensure user_id and article_id are NOT NULL
    table.integer('user_id').unsigned().notNullable().alter();
    table.integer('article_id').unsigned().notNullable().alter();
  });
}

export async function down(knex) {
  return knex.schema.alterTable('user_bookmarks', (table) => {
    // Remove NOT NULL constraints (rollback)
    table.integer('user_id').unsigned().nullable().alter();
    table.integer('article_id').unsigned().nullable().alter();
  });
}
