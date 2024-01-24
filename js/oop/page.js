import { ApiFetch } from "./api.js";
import { Game, Games } from "./games.js";

export class Page {
  #games;
  #filtersSection;

  constructor(filters) {
    this.loading();
    new ApiFetch().getAllGames().then((games) => {
      this.#games = new Games(games, filters);
      this.displayRootStructure();
      this.#filtersSection = new FiltersSection(this.#games);
    });
  }

  displayRootStructure() {
    const root = document.getElementById("root");
    root.innerHTML = `
      <header id="pageHeader">
        <h1>Games Reviews</h1>
      </header>
      <main>
        <section>
          <header>
            <div id="filters"></div>
            <div id="gamesSorting"></div>
          </header>
          <section id="games">
            <header>
              <div id="pagination"></div>
              <div id="search"></div>
            </header>
            <div id="gamesList"></div>
            <footer id="paginationFooter"></footer>
          </section>
          <footer></footer>
        </section>
        <section id="gameModal"></section>
      </main>
    `;
  }

  loading() {
    const root = document.getElementById("root");
    root.innerHTML = `
      <div class="loadingSpinner-wraper">
        <div class="loading-ring">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    `;
  }
}

class FiltersSection {
  #games;
  activeFilters = {};
  #paginationSection;

  constructor(games) {
    this.#games = games;
    this.filteredGames = this.#games.all;
    this.filters = this.#extractFilters();
    this.displaySection();
    this.displaySearchSection();
    this.#paginationSection = new PaginationSection(this.filteredGames);
  }

  displaySection() {
    const filtersSection = document.getElementById("filters");
    filtersSection.innerHTML = `
      <h2>
        <span class="sr-only">Filters</span>
        <label for="filterToggle">
          <i class="fa-solid fa-filter"></i>
        </label>
        <input type="checkbox" id="filterToggle" />
      </h2>
      <div></div>
    `;

    this.filters.forEach(({ type, values }) => {
      const newFilterDivision = `
        <div id="${type}s">
          <h3>${type}s</h3>
          <ul>
            <li>
              <input type="checkbox" id="all-${type}s" ${
        this.activeFilters[type]?.length ? "" : "checked disabled"
      } />
              <label for="all-${type}s" class="filterTag">
                <span class="filterValue">All</span>
                <span class="quantity">${this.filteredGames.length}</span>
              </label>
            </li>
            ${Object.keys(values)
              .sort()
              .map((value) => {
                const allGamesCount = values[value].games.length;
                const filteredGamesCount = this.filteredGames.filter(
                  (fgame) => fgame[type] == value
                ).length;

                return `
                  <li>
                    <input type="checkbox" id="${value}" ${
                  values[value].checked && "checked"
                } />
                    <label for="${value}" class="filterTag" title="${allGamesCount}">
                      <span class="filterValue">${value}</span>
                      <span class="quantity">${filteredGamesCount}</span>
                    </label>
                  </li>
                `;
              })
              .join("")}
          </ul>
        </div>
      `;

      document
        .querySelector("#filters > div:first-of-type")
        .insertAdjacentHTML("beforeend", newFilterDivision);

      const all = document.querySelector(
        `#${type}s input[type="checkbox"]#all-${type}s`
      );
      const allFilters = document.querySelectorAll(
        `#${type}s input[type="checkbox"]:not(#all-${type}s)`
      );

      all.addEventListener("change", (event) => {
        event.target.checked && this.clearActiveFilters();
      });

      allFilters.forEach((filterElement) => {
        filterElement.addEventListener("change", (event) =>
          this.#updateActiveFilters(event, type)
        );
      });
    });
  }

  displaySearchSection() {
    const searchSection = document.getElementById("search");
    searchSection.innerHTML = `
      <input
        type="text"
        id="searchInput"
        placeholder="Search from ${this.filteredGames.length} games"
        autocomplete="no"
      />
    `;

    const searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("input", (event) => {
      const filteredGames = this.filteredGames.filter((game) =>
        game.title.toLowerCase().includes(event.target.value.toLowerCase())
      );
      this.#paginationSection.refreshGamesList(filteredGames);
    });
  }

  #updateActiveFilters(event, filter) {
    const filterValue =
      event.target.nextElementSibling.firstElementChild.innerText;

    if (!this.activeFilters[filter]) this.activeFilters[filter] = [];

    if (this.activeFilters[filter].includes(filterValue))
      if (this.activeFilters[filter].length == 1)
        delete this.activeFilters[filter];
      else
        this.activeFilters[filter].splice(
          this.activeFilters[filter].indexOf(filterValue),
          1
        );
    else this.activeFilters[filter].push(filterValue);

    const filterObj = this.filters.filter(({ type }) => type == filter)[0]
      .values[filterValue];
    filterObj.checked = event.target.checked;

    this.refreshGamesAndFilters(filter, event.target.checked);
  }

  clearActiveFilters() {
    Object.keys(this.activeFilters).forEach((filter) => {
      this.activeFilters[filter].forEach((filterValue) => {
        this.filters.filter(({ type }) => type == filter)[0].values[
          filterValue
        ].checked = false;
      });
    });

    this.activeFilters = {};
    this.refreshGamesAndFilters();
  }

  updateFilteredGames() {
    if (Object.keys(this.activeFilters).length) {
      this.filteredGames = [];
      Object.keys(this.activeFilters).forEach((filter) => {
        this.activeFilters[filter].forEach((filterValue) => {
          const filterValueGames = this.filters.filter(
            ({ type }) => type == filter
          )[0].values[filterValue].games;
          filterValueGames.forEach((game) => {
            if (
              !this.filteredGames.filter(({ title }) => title == game.title)
                .length
            )
              this.filteredGames.push(game);
          });
        });
      });
    } else this.filteredGames = this.#games.all;
  }

  refreshGamesAndFilters(filter, checked) {
    this.updateFilteredGames();
    filter && checked && this.#checkOtherFilters(filter);
    this.displaySection();
    this.displaySearchSection();
    this.#paginationSection.refreshGamesList(this.filteredGames);
  }

  #checkOtherFilters(filter) {
    this.filters.forEach((originalFilter) => {
      if (originalFilter.type != filter)
        Object.keys(originalFilter.values).forEach((otherValue) => {
          if (
            !this.activeFilters[originalFilter.type] ||
            !this.activeFilters[originalFilter.type].includes(otherValue)
          ) {
            let included = true;

            originalFilter.values[otherValue].games.forEach((game) => {
              if (included) {
                if (
                  !this.filteredGames.filter(({ title }) => title == game.title)
                    .length
                )
                  included = false;
              } else return;
            });

            if (included) {
              if (!this.activeFilters[originalFilter.type])
                this.activeFilters[originalFilter.type] = [];
              this.activeFilters[originalFilter.type].push(otherValue);
              originalFilter.values[otherValue].checked = true;
              this.updateFilteredGames();
            }
          }
        });
    });
  }

  #extractFilters() {
    return this.#games.filters.map((filter) => this.#games[filter]);
  }
}

class PaginationSection {
  currentPage = 1;
  gamesPerPage = 18;
  sorting = {};

  constructor(filteredGames) {
    this.filteredGames = filteredGames;
    this.displaySection();
    this.gamesListSection = this.displayGames(true);
    this.displaySortingSection();
  }

  displaySection() {
    const paginationHeader = document.getElementById("pagination");
    const paginationFooter = document.getElementById("paginationFooter");
    const lastPage =
      Math.ceil(this.filteredGames.length / this.gamesPerPage) || 1;
    if (this.currentPage > lastPage) this.currentPage = lastPage;

    paginationHeader.innerHTML = `
      <div>
        <span id="firstPage">01</span>
        <button type="button" id="goToFirstPage" ${
          this.currentPage == 1 ? "disabled" : ""
        }>
          <i
            class="fa-solid fa-angles-left"
            title="Go to the first page"
          ></i>
        </button>
      </div>
      <div>
        <button type="button" id="goToPreviousPage" ${
          this.currentPage == 1 ? "disabled" : ""
        }>
          <i
            class="fa-solid fa-angle-left"
            title="Go to the previous page"
          ></i>
        </button>
        <span id="currentPage">${this.currentPage}</span>
        <button type="button" id="goToNextPage" ${
          this.currentPage >= lastPage ? "disabled" : ""
        }>
          <i
            class="fa-solid fa-angle-right"
            title="Go to the next page"
          ></i>
        </button>
      </div>
      <div>
        <button type="button" id="goToLastPage" ${
          this.currentPage >= lastPage ? "disabled" : ""
        }>
          <i
            class="fa-solid fa-angles-right"
            title="Go to the last page"
          ></i>
        </button>
        <span id="lastPage">${lastPage < 10 ? "0" : ""}${lastPage}</span>
      </div>
    `;

    paginationFooter.innerHTML = `
      <p>
        <span>Displaying</span>
        <select id="gamesPerList">
          <option value="18">18</option>
          <option value="30">30</option>
          <option value="60">60</option>
        </select>
        <span>Games per page.</span>
      </p>
    `;

    const goToFirstPage = document.getElementById("goToFirstPage");
    const goToLastPage = document.getElementById("goToLastPage");
    const goToPreviousPage = document.getElementById("goToPreviousPage");
    const goToNextPage = document.getElementById("goToNextPage");

    goToFirstPage.addEventListener("click", () => this.goToFirstPage());
    goToLastPage.addEventListener("click", () => this.goToLastPage());
    goToPreviousPage.addEventListener("click", () => this.goToPreviousPage());
    goToNextPage.addEventListener("click", () => this.goToNextPage());

    const gamesPerList = document.getElementById("gamesPerList");
    gamesPerList.value = this.gamesPerPage;
    gamesPerList.addEventListener("change", (event) =>
      this.changeGamesPerPage(+event.target.value)
    );
  }

  displaySortingSection() {
    const gamesSortingSection = document.getElementById("gamesSorting");
    gamesSortingSection.innerHTML = `
      <h2 class="sr-only">Sort Games</h2>
      <div id="byTitle">
        <h3 class="sr-only">by Title</h3>
        <button type="button" ${
          this.sorting.by == "title" && this.sorting.ascending == true
            ? "id='sortingChoice'"
            : ""
        } title="Ascending Sort by Title" data-sortBy="title" data-sortDirection="ascending">
          <span class="sr-only">Ascending</span>
          <i class="fa-solid fa-arrow-down-a-z"></i>
        </button>
        <button type="button" ${
          this.sorting.by == "title" && this.sorting.ascending == false
            ? "id='sortingChoice'"
            : ""
        } title="Descending Sort by Title"  data-sortBy="title" data-sortDirection="descending">
          <span class="sr-only">Descending</span>
          <i class="fa-solid fa-arrow-up-z-a"></i>
        </button>
      </div>
      <div id="byReleaseDate">
        <h3 class="sr-only">by Release Date</h3>
        <button type="button" ${
          this.sorting.by == "releaseDate" && this.sorting.ascending == true
            ? "id='sortingChoice'"
            : ""
        } title="Ascending Sort by Release Date from newest to oldest"  data-sortBy="releaseDate" data-sortDirection="ascending">
          <span class="sr-only">Ascending</span>
          <i class="fa-solid fa-arrow-down-long"></i>
          <i class="fa-solid fa-calendar-days"></i>
        </button>
        <button type="button" ${
          this.sorting.by == "releaseDate" && this.sorting.ascending == false
            ? "id='sortingChoice'"
            : ""
        } title="Descending Sort by Release Date from oldest to newest"  data-sortBy="releaseDate" data-sortDirection="descending">
          <span class="sr-only">Descending</span>
          <i class="fa-solid fa-arrow-up-long"></i>
          <i class="fa-solid fa-calendar-days"></i>
        </button>
      </div>
      <div id="byId">
        <h3 class="sr-only">by Title</h3>
        <button type="button" ${
          this.sorting.by == "id" && this.sorting.ascending == true
            ? "id='sortingChoice'"
            : ""
        } title="Ascending Sort by ID"  data-sortBy="id" data-sortDirection="ascending">
          <span class="sr-only">Ascending</span>
          <i class="fa-solid fa-arrow-down-1-9"></i>
        </button>
        <button type="button" ${
          this.sorting.by == "id" && this.sorting.ascending == false
            ? "id='sortingChoice'"
            : ""
        } title="Descending Sort by ID"  data-sortBy="id" data-sortDirection="descending">
          <span class="sr-only">Descending</span>
          <i class="fa-solid fa-arrow-up-9-1"></i>
        </button>
      </div>
      
    `;

    gamesSortingSection.querySelectorAll("button").forEach((buttonElement) => {
      const self = this;
      buttonElement.addEventListener("click", function () {
        self.sorting.by = this.getAttribute("data-sortBy");
        self.sorting.ascending =
          this.getAttribute("data-sortDirection") == "ascending" ? true : false;
        self.sortGames(self.sorting.by, self.sorting.ascending);
      });
    });
  }

  displayGames(newInstance = false) {
    const startingIndex = (this.currentPage - 1) * this.gamesPerPage;
    const endingIndex = this.currentPage * this.gamesPerPage;
    const gamesList = this.filteredGames.slice(startingIndex, endingIndex);

    if (newInstance) return new GamesListSection(gamesList);
    else this.gamesListSection.displaySection(gamesList);
  }

  goToFirstPage() {
    this.currentPage = 1;
    this.refreshGamesList(this.filteredGames);
  }

  goToLastPage() {
    this.currentPage = Math.ceil(this.filteredGames.length / this.gamesPerPage);
    this.refreshGamesList(this.filteredGames);
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.refreshGamesList(this.filteredGames);
    }
  }

  goToNextPage() {
    if (
      this.currentPage <
      Math.ceil(this.filteredGames.length / this.gamesPerPage)
    ) {
      this.currentPage++;
      this.refreshGamesList(this.filteredGames);
    }
  }

  changeGamesPerPage(value) {
    this.gamesPerPage = value;
    this.refreshGamesList(this.filteredGames);
  }

  refreshGamesList(filteredGames) {
    this.filteredGames = filteredGames;
    if (this.sorting.by)
      this.sortGames(this.sorting.by, this.sorting.ascending);

    this.displaySection();
    this.displayGames();
  }

  sortGames(by, ascending) {
    this.filteredGames.sort((a, b) =>
      (
        typeof new Date(a[by] == "object")
          ? ascending
            ? new Date(a[by]) < new Date(b[by])
            : new Date(a[by]) > new Date(b[by])
          : typeof a[by] == "string"
          ? ascending
            ? a[by].toLowerCase() > b[by].toLowerCase()
            : a[by].toLowerCase() < b[by].toLowerCase()
          : ascending
          ? a[by] > b[by]
          : a[by] < b[by]
      )
        ? 1
        : -1
    );

    this.displaySortingSection();
    this.displayGames();
  }
}

class GamesListSection {
  constructor(games) {
    this.displaySection(games);
  }

  displaySection(games) {
    const gamesSection = document.getElementById("gamesList");
    gamesSection.innerHTML = games.length
      ? `
      <ul>
        ${games
          .map(
            (game) => `
              <li class="game" data-gameId="${game.id}">
                <figure>
                  <img src="${game.thumbnail}"></img>
                  <figcaption>
                    <div>
                      <div class="head">
                        <h3>${game.title}</h3>
                        <span class="tag">${game.price || "Free"}</span>
                      </div>
                      <p>${game.shortDescription}</p>
                    </div>
                    <div class="foot">
                      <span class="tag">${game.genre}</span>
                      <span class="tag">${game.platform}</span>
                    </div>
                  </figcaption>
                </figure>
              </li>
            `
          )
          .join("")}
      </ul>
    `
      : "<P class='empty'>No available games!</p>";

    gamesSection.querySelectorAll("li.game").forEach((gameElement) => {
      gameElement.addEventListener("click", function () {
        document.body.style.overflow = "hidden";
        new GameModalSection(+this.getAttribute("data-gameId"));
      });
    });
  }
}

class GameModalSection {
  constructor(gameId) {
    this.currentScreenshot = 0;
    this.gameModalSection = document.getElementById("gameModal");
    this.displaySection();
    this.loading();
    new ApiFetch().getSpecificGame(gameId).then((game) => {
      this.game = new Game(game);
      this.displayData();
      this.game.screenshots.length && this.displayScreenshots();
    });
  }

  displaySection() {
    this.gameModalSection.innerHTML = `
      <div id="modalBackdrop"></div>
      <div id="gameDataModal" class="container"></div>
    `;
  }

  displayData() {
    this.gameModalSection.querySelector("#gameDataModal").innerHTML = `
      <button type="button" id="closeModalButton">
        <i class="fa-solid fa-xmark"></i>
      </button>
      <header style="background-image: url(${this.game.thumbnail});">
        <h3>${this.game.title}</h3>
      </header>
      <div>
        <p class="att"><span>Genre:</span> <span>${this.game.genre}</span></p>
        <p class="att"><span>Status:</span> <span>${this.game.status}</span></p>
      </div>
      <p>${this.game.description}</p>
      <div id="screenshots"></div>
      ${
        this.game.minSystReq
          ? `
          <div>
            <h4>System Requirements</h4>
            ${Object.keys(this.game.minSystReq)
              .map(
                (req) =>
                  `<p class="sysReq"><span>${req}:</span> <span>${
                    this.game.minSystReq[req] || "Unkown"
                  }</span></p>`
              )
              .join("")}
          </div>
        `
          : ""
      }
      <div>
        <p class="att"><span>Developer:</span> <span>${
          this.game.developer
        }</span></p>
        <p class="att"><span>Publisher:</span> <span>${
          this.game.publisher
        }</span></p>
        <p class="att"><span>ReleaseDate:</span> <span>${
          this.game.releaseDate
        }</span></p>
      </div>
      <a href="${
        this.game.gameProfileUrl
      }" id="gameLink" target="_blank">Game Reviews</a>
    `;

    this.gameModalSection
      .querySelector("#modalBackdrop")
      .addEventListener("click", () => {
        this.gameModalSection.innerHTML = "";
        document.body.style.overflow = "auto";
      });

    this.gameModalSection
      .querySelector("#closeModalButton")
      .addEventListener("click", () => {
        this.gameModalSection.innerHTML = "";
        document.body.style.overflow = "auto";
      });
  }

  displayScreenshots() {
    const numOfImages = this.game.screenshots.length;

    document.getElementById("screenshots").innerHTML = `
      <h4>Screenshots</h4>
      <img src=${
        this.game.screenshots[this.currentScreenshot].image
      } alt="Screenshot from ${this.game.title}" />
      <div>
        ${this.game.screenshots
          .map(
            ({ image }, index) =>
              `<img src=${image} alt="Screenshot from ${
                this.game.title
              }" style="width: calc((100% - 0.5rem * ${
                numOfImages - 1
              }) / ${numOfImages}); ${
                index == this.currentScreenshot ? "opacity: 1;" : ""
              }" data-imageIndex="${index}" />`
          )
          .join("")}
      </div>
    `;

    document
      .querySelectorAll("#screenshots div img")
      .forEach((imageElement) => {
        const self = this;
        imageElement.addEventListener("click", function () {
          self.currentScreenshot = +this.getAttribute("data-imageIndex");
          self.displayScreenshots();
        });
      });
  }

  loading() {
    const root = document.getElementById("gameDataModal");
    root.innerHTML = `
      <div class="loadingSpinner-wraper">
        <div class="loading-ring">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    `;
  }
}
