import { faker } from '@faker-js/faker';

export function generateMockSavedArticles(numArticles = 5) {
  return Array.from({ length: numArticles }).map(() => ({
    source: { name: faker.company.name() },
    author: faker.helpers.maybe(() => faker.person.fullName(), {
      probability: 0.8,
    }), // ✅ Matches API format
    title: faker.lorem.sentence(),
    description: faker.helpers.maybe(() => faker.lorem.paragraph(), {
      probability: 0.9,
    }), // ✅ Now allows `null`
    url: faker.internet.url(),
    urlToImage: faker.helpers.maybe(() => faker.image.url(), {
      probability: 0.8,
    }), // ✅ Now allows `null`
    publishedAt: faker.date.recent({ days: 30 }).toISOString(),
  }));
}
