import { faker } from '@faker-js/faker';

export function generateMockSavedArticles(numArticles = 5) {
  return Array.from({ length: numArticles }).map(() => ({
    source: { name: faker.company.name() }, // ✅ Matches API format
    author: faker.helpers.maybe(() => faker.person.fullName(), {
      probability: 0.8,
    }), // ✅ Matches API format
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    url: faker.internet.url(),
    urlToImage: faker.image.url(), // ✅ Matches API format
    publishedAt: faker.date.recent({ days: 30 }).toISOString(),
    content: faker.helpers.maybe(() => faker.lorem.paragraphs(2), {
      probability: 0.7,
    }),
  }));
}
