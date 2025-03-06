export async function seed(knex) {
  await knex('users').del();

  const users = [];

  // ✅ Always insert at least **one** user with a password
  users.push({
    username: 'testuser',
    email: 'testuser@example.com',
    password_hash: await bcrypt.hash('Password123!', 10),
    oauth_provider: null,
    oauth_id: null,
  });

  // 🔹 Insert 4 more users (random OAuth or password users)
  for (let i = 0; i < 4; i++) {
    const useOAuth = faker.datatype.boolean(); // 50% chance of using OAuth

    users.push({
      username: faker.internet.username(),
      email: faker.internet.email(),
      password_hash: useOAuth ? null : await bcrypt.hash('Password123!', 10),
      oauth_provider: useOAuth ? 'google' : null,
      oauth_id: useOAuth ? faker.string.uuid() : null,
    });
  }

  await knex('users').insert(users);
}
