import { faker } from '@faker-js/faker';

export function generateMockArticlesResponse(
  numArticles = 5,
  keyword = '',
  isNew = false,
  isOld = false,
  maxAgeHours = 3
) {
  const articles = Array.from({ length: numArticles }).map(() => {
    let publishedAt;
    if (isNew) {
      const now = new Date();
      publishedAt = new Date(
        now.getTime() - Math.random() * maxAgeHours * 60 * 60 * 1000
      ).toISOString(); // Within 3 hours
    } else if (isOld) {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5); // Set to 5 days ago
      publishedAt = pastDate.toISOString();
    } else {
      publishedAt = new Date().toISOString(); // Default to now
    }

    return {
      source: {
        id: faker.helpers.maybe(() => faker.string.alphanumeric(10), {
          probability: 0.2,
        }),
        name: faker.company.name(),
      },
      author: faker.helpers.maybe(() => faker.person.fullName(), {
        probability: 0.8,
      }),
      title: `${faker.lorem.sentence()} ${keyword}`,
      description: faker.lorem.paragraph(),
      url: faker.internet.url(),
      urlToImage: faker.image.url(),
      publishedAt,
      content: faker.helpers.maybe(() => faker.lorem.paragraphs(2), {
        probability: 0.7,
      }),
    };
  });

  return {
    status: 'ok',
    totalResults: numArticles,
    articles, // Ensure articles are not nested under another 'articles' key
  };
}
