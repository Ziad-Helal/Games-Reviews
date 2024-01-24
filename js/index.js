import { Page } from "./oop/page.js";

(function () {
  const filters = ["genres", "platforms"];
  const categories = [
    "mmorpg",
    "shooter",
    "sailing",
    "permadeath",
    "superhero",
    "pixel",
  ];

  new Page(filters, categories);
})();
