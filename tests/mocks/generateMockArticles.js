import { faker } from '@faker-js/faker';

export function generateMockArticlesResponse(
  numArticles = 5,
  keyword = '',
  isNew = false,
  isOld = false,
  maxAgeHours = 3
) {
  return {
    articles: Array.from({ length: numArticles }).map(() => {
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
        title: `${faker.lorem.sentence()} ${keyword}`,
        description: faker.lorem.paragraph(),
        url: faker.internet.url(),
        urlToImage: faker.image.url(),
        publishedAt,
      };
    }),
  };
}


// export function generateMockArticlesResponse(
//   numArticles = 5,
//   keyword = '',
//   //params for date control
//   //newDates: future timestamps
//   //oldDates: past timestamps
//   //default: random timestamps
//   newDates = false,
//   oldDates = false
// ) {
//   const now = new Date();

//   return {
//     status: 'ok',
//     totalResults: numArticles,
//     articles: Array.from({ length: numArticles }).map((_, index) => {
//       let publishedAt;

//       if (newDates) {
//         publishedAt = new Date(
//           now.getTime() + (index + 1) * 1000 * 60 * 60
//         ).toISOString(); // Future timestamps
//       } else if (oldDates) {
//         publishedAt = new Date(
//           now.getTime() - (index + 1) * 1000 * 60 * 60
//         ).toISOString(); // Past timestamps
//       } else {
//         publishedAt = faker.date.recent({ days: 30 }).toISOString(); // Default random timestamp
//       }

//       return {
//         title: `${faker.lorem.sentence()} ${keyword}`,
//         description: faker.lorem.paragraph(),
//         url: faker.internet.url(),
//         urlToImage: faker.image.url(),
//         publishedAt,
//         source: { name: faker.company.name() },
//         author: faker.helpers.maybe(() => faker.person.fullName(), {
//           probability: 0.8,
//         }),
//       };
//     }),
//   };
// }
