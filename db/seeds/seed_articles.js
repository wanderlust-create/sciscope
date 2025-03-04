import { faker } from '@faker-js/faker';

export async function seed(knex) {
  await knex('articles').del();

  const articles = [];
  for (let i = 0; i < 10; i++) {
    articles.push({
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      url: faker.internet.url(),
      url_to_image: faker.image.url(),
      published_at: faker.date.past().toISOString(),
      author_name: faker.person.fullName(),
      source_name: faker.company.name(),
    });
  }
  await knex('articles').insert(articles);
}
