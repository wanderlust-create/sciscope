import { faker } from '@faker-js/faker';

export async function seed(knex) {
  await knex('articles').del();

  const keywords = ['jupiter', 'mars', 'saturn', 'venus', 'exoplanet'];

  const articles = [];
  for (let i = 0; i < 300; i++) {
    const keyword = keywords[i % keywords.length]; // Cycle through keywords

    articles.push({
      title: `${faker.lorem.words(3)} about ${keyword}`, // Include keyword in title
      description: `This is an article about ${keyword}. ${faker.lorem.sentence()}`,
      // content: `Scientific research on ${keyword} shows interesting results.`,
      url: faker.internet.url(),
      url_to_image: faker.image.url(),
      published_at: faker.date.past().toISOString(),
      author_name: faker.person.fullName(),
      source_name: faker.company.name(),
    });
  }

  await knex('articles').insert(articles);
}
