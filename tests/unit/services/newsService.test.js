import { jest } from "@jest/globals";
import NewsService from "../../../src/services/newsService.js";

const mockNews = [
  {
    source: { name: "Indiandefencereview.com" },
    author: null,
    title:
      "Scientists Stunned After Finding Organic Molecules in a 66-Million-Year-Old Dinosaur Bone",
    description:
      "For more than a century, paleontologists believed that fossilization erased all traces of organic molecules from dinosaur bones.",
    url: "https://indiandefencereview.com/organic-molecules-66-M-year-dinosaur-bone/",
    urlToImage:
      "https://indiandefencereview.com/wp-content/uploads/2025/02/Scientists-Stunned.jpg",
    publishedAt: "2025-02-12T21:14:33Z",
  },
];

describe("News Service", () => {
  it("should fetch science news successfully", async () => {
    jest.spyOn(NewsService, "fetchScienceNews").mockResolvedValueOnce(mockNews);

    const news = await NewsService.fetchScienceNews();
    expect(news).toEqual(mockNews);
  });

  it("should handle API failure", async () => {
    jest
      .spyOn(NewsService, "fetchScienceNews")
      .mockRejectedValueOnce(new Error("Failed to fetch news"));

    await expect(NewsService.fetchScienceNews()).rejects.toThrow(
      "Failed to fetch news",
    );
  });
});
