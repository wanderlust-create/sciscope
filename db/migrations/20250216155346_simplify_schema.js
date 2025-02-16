export async function up(knex) {
  // 1. Remove foreign keys from `articles`
  await knex.schema.table('articles', (table) => {
    table.dropForeign(['author_id']);
    table.dropForeign(['source_id']);
  });

  // 2. Drop the columns that reference authors/sources
  await knex.schema.table('articles', (table) => {
    table.dropColumn('author_id');
    table.dropColumn('source_id');
  });

  // 3. Add new columns for author_name, source_name
  await knex.schema.table('articles', (table) => {
    table.string('author_name', 255).nullable();
    table.string('source_name', 255).nullable();
  });

  // 4. Drop the authors & sources tables
  await knex.schema.dropTableIfExists('authors');
  await knex.schema.dropTableIfExists('sources');
}

export async function down() {
  // No rollback
  return Promise.resolve();
}
