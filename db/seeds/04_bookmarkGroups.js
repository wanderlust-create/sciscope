export async function seed(knex) {
  await knex('bookmark_group_assignments').del();
  await knex('bookmark_groups').del();

  // Grab a known user with a password
  const user = await knex('users').whereNotNull('password_hash').first();

  // Grab some bookmarks for that user
  const bookmarks = await knex('user_bookmarks')
    .where('user_id', user.id)
    .limit(10);

  // Create 2 groups for the user
  const groups = [
    { user_id: user.id, group_name: 'Planets' },
    { user_id: user.id, group_name: 'Astrobiology' },
  ];

  const insertedGroups = await knex('bookmark_groups')
    .insert(groups)
    .returning('*');

  // Assign bookmarks to groups (evenly distributed)
  const assignments = bookmarks.map((bookmark, idx) => ({
    user_bookmark_id: bookmark.id,
    bookmark_group_id: insertedGroups[idx % insertedGroups.length].id,
  }));

  await knex('bookmark_group_assignments').insert(assignments);
}
