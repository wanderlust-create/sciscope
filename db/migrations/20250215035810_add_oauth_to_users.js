export async function up(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.string('oauth_provider').nullable();
    table.string('oauth_id').nullable().unique();
    table.string('password_hash', 255).nullable().alter();
  });
}

export async function down(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('oauth_provider');
    table.dropColumn('oauth_id');
    table.string('password_hash', 255).notNullable().alter();
  });
}
