export async function up(knex) {
  // Create sources table
  await knex.schema.createTable('sources', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.text('description');
    table.text('url').notNullable();
  });

  // Create authors table
  await knex.schema.createTable('authors', (table) => {
    table.increments('id').primary();
    table.string('first_name', 255).notNullable();
    table.string('last_name', 255).notNullable();
    table.text('bio');
    table.text('website');
  });

  // Create articles table
  await knex.schema.createTable('articles', (table) => {
    table.increments('id').primary();
    table.text('title').notNullable();
    table.text('description');
    table.text('content');
    table
      .integer('author_id')
      .unsigned()
      .references('id')
      .inTable('authors')
      .onDelete('SET NULL');
    table
      .integer('source_id')
      .unsigned()
      .references('id')
      .inTable('sources')
      .onDelete('SET NULL');
    table.text('url').notNullable().unique();
    table.text('url_to_image');
    table.timestamp('published_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Create users table
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('username', 255).unique().notNullable();
    table.string('email', 255).unique().notNullable();
    table.string('password_hash', 255).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Create bookmark_groups table
  await knex.schema.createTable('bookmark_groups', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('group_name', 255).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Create user_bookmarks table
  await knex.schema.createTable('user_bookmarks', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .integer('article_id')
      .unsigned()
      .references('id')
      .inTable('articles')
      .onDelete('CASCADE');
    table.timestamp('bookmarked_at').defaultTo(knex.fn.now());
    table.unique(['user_id', 'article_id']);
  });

  // Create bookmark_group_assignments table
  await knex.schema.createTable('bookmark_group_assignments', (table) => {
    table.increments('id').primary();
    table
      .integer('user_bookmark_id')
      .unsigned()
      .references('id')
      .inTable('user_bookmarks')
      .onDelete('CASCADE');
    table
      .integer('bookmark_group_id')
      .unsigned()
      .references('id')
      .inTable('bookmark_groups')
      .onDelete('CASCADE');
    table.timestamp('assigned_at').defaultTo(knex.fn.now());
    table.unique(['user_bookmark_id', 'bookmark_group_id']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('bookmark_group_assignments');
  await knex.schema.dropTableIfExists('user_bookmarks');
  await knex.schema.dropTableIfExists('bookmark_groups');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('articles');
  await knex.schema.dropTableIfExists('authors');
  await knex.schema.dropTableIfExists('sources');
}
