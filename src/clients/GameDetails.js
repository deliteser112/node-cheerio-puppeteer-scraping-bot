const axios = require('axios')
const parser = require('xml2json')

const BOARDGAME_API = 'https://www.boardgamegeek.com/xmlapi/boardgame/'
const BOARDGAME_STATS_API =
  'https://boardgamegeek.com/xmlapi2/thing?stats=1&id='

const getBoardgameApiEndpoint = (game) =>
  BOARDGAME_API + game.link.split('/')[4]

const getBoardgameStatsApiEndpoint = (game) =>
  BOARDGAME_STATS_API + game.link.split('/')[4]

const retryGameDetails = (url, resolve) =>
  axios
    .get(url)
    .then((data) => {
      data = JSON.parse(parser.toJson(data.data)).boardgames.boardgame
      return resolve(data)
    })
    .catch((e) => {
      retryGameDetails(e.config.url, resolve)
    })

const retryGameStats = (url, resolve) =>
  axios
    .get(url)
    .then((data) => {
      data = JSON.parse(parser.toJson(data.data)).items.item.statistics.ratings
      return resolve(data)
    })
    .catch((e) => {
      retryGameStats(e.config.url, resolve)
    })

class GameDetails {
  getGameDetails(game) {
    return new Promise((resolve, reject) =>
      axios
        .get(getBoardgameApiEndpoint(game))
        .then((data) => {
          const details = JSON.parse(parser.toJson(data.data)).boardgames
            .boardgame
          return resolve(details)
        })
        .catch((e) => {
          retryGameDetails(e.config.url, resolve)
        }),
    )
  }

  getGameStats(game) {
    return new Promise((resolve, reject) =>
      axios
        .get(getBoardgameStatsApiEndpoint(game))
        .then((data) => {
          const stats = JSON.parse(parser.toJson(data.data)).items.item
            .statistics.ratings
          return resolve(stats)
        })
        .catch((e) => {
          retryGameStats(e.config.url, resolve)
        }),
    )
  }

  getGamesList(i) {
    return axios.get('https://boardgamegeek.com/browse/boardgame/page/' + i)
  }
}

module.exports = GameDetails
