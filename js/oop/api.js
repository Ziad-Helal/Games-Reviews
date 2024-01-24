export class ApiFetch {
  constructor() {
    this.baseUrl = "https://free-to-play-games-database.p.rapidapi.com/api/";
    this.endPoints = {
      allGames: "games",
      specificGame: "game?id=",
    };
    this.options = {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": "a61ac3e521mshe6195b57916590ap174762jsn7954b21a6983",
        "X-RapidAPI-Host": "free-to-play-games-database.p.rapidapi.com",
      },
    };
  }

  getAllGames() {
    const url = this.baseUrl + this.endPoints.allGames;
    return this.#fetchData(url);
  }

  getSpecificGame(gameId) {
    const url = this.baseUrl + this.endPoints.specificGame + gameId;
    return this.#fetchData(url);
  }

  async #fetchData(url) {
    let response;
    try {
      response = await fetch(url, this.options).then((response) =>
        response.json()
      );
    } catch (error) {
      alert(error);
    }

    return response;
  }
}
