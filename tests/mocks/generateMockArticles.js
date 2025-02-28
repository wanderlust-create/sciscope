import { faker } from '@faker-js/faker';

export function generateMockArticlesResponse(numArticles = 5, keyword = '') {
  const articles = Array.from({ length: numArticles }).map(() => ({
    source: {
      id: faker.helpers.maybe(() => faker.string.alphanumeric(10), {
        probability: 0.2,
      }),
      name: faker.company.name(),
    },
    author: faker.helpers.maybe(() => faker.person.fullName(), {
      probability: 0.8,
    }),
    title: keyword
      ? `${keyword} ${faker.lorem.words(3)}`
      : faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    url: faker.internet.url(),
    urlToImage: faker.image.url(),
    publishedAt: faker.date.recent({ days: 30 }).toISOString(),
    content: faker.helpers.maybe(() => faker.lorem.paragraphs(2), {
      probability: 0.7,
    }),
  }));
  return {
    status: 'ok',
    totalResults: numArticles,
    articles,
  };
}
