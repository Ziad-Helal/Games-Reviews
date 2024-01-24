export class Games {
  constructor(games, filters) {
    this.all = this.#getGames(games);
    this.filters = filters;
    this.#extractFilters();
  }

  #getGames(games) {
    return games.map((game) => new Game({ ...game }));
  }

  #extractFilters() {
    this.filters.forEach((filter) => {
      this[filter] = new GameFilter(
        filter.slice(0, -1),
        Array.from(new Set(this.all.map((game) => game[filter.slice(0, -1)]))),
        this.all
      );
    });
  }

  sort(by = "title", ascending = true) {
    this.all.sort((a, b) =>
      (
        typeof a[by] == "string"
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
  }
}

export class Game {
  constructor({
    id,
    title,
    thumbnail,
    status,
    short_description,
    description,
    game_url,
    genre,
    platform,
    publisher,
    developer,
    release_date,
    freetogame_profile_url,
    minimum_system_requirements,
    screenshots,
  }) {
    this.id = id;
    this.title = title;
    this.thumbnail = thumbnail;
    this.status = status;
    this.shortDescription = short_description;
    this.description = description;
    this.gameUrl = game_url;
    this.genre = genre.trim();
    this.platform = platform;
    this.publisher = publisher;
    this.developer = developer;
    this.releaseDate =
      release_date.split("-")[2] == "00"
        ? release_date.split("-").slice(0, 1).concat("01").join("-")
        : release_date;
    this.gameProfileUrl = freetogame_profile_url;
    this.minSystReq = minimum_system_requirements;
    this.screenshots = screenshots;
    this.price = 0;
  }
}

class GameFilter {
  values = {};

  constructor(type, filterValues, games) {
    this.type = type;
    this.#extractFilterValues(filterValues, games);
  }

  #extractFilterValues(filterValues, games) {
    filterValues.forEach((value) => {
      this.values[value] = {
        games: games.filter((game) => game[this.type] == value),
        checked: false,
      };
    });
  }
}
