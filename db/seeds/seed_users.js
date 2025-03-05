import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

export async function seed(knex) {
  await knex('users').del();

  const users = [];
  for (let i = 0; i < 5; i++) {
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
