const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config()

const hostname = process.env.MONGO_HOSTNAME
const database = process.env.MONGO_DATABASE_NAME
const debugging = process.env.DEBUGGING

const GameModel = require('./src/models/Game')
const GameDetails = require('./src/clients/GameDetails')
const CatalogueParser = require('./src/parsers/Catalogue')
const { default: puppeteer } = require('puppeteer')

const catalogue = new CatalogueParser([])
const gameDetails = new GameDetails()

const username = 'deltaberet'
const password = 'agiledev115'

const period = 90
const setDelay = 10000

let pageCount = 0
let browser
let page

// mongoose.connect('mongodb://127.0.0.1:27017/meteor', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })

mongoose.connect('mongodb://' + hostname + ':' + portnumber + '/' + database, {
  useNewUrlParser: true,
  useFindAndModify: true,
  useUnifiedTopology: true,
})

const db = mongoose.connection

db.on('error', (e) => console.error('Database not connected: ' + e))
db.once('open', () => console.log('Database connected OK'))

if (debugging == ' true') {
  console.log('Running in debug mode.')

  // console.log("Dropping database...");
  // db.dropDatabase((err, result) => {
  //     if(!err) console.log("Database dropped.")
  // });
}

async function getPageCount() {
  await page.goto('https://boardgamegeek.com/browse/boardgame/page/1', {
    waitUntil: 'domcontentloaded',
  })
  await page.waitForTimeout(50)

  let link = await page.$('a[title="last page"]')
  let total = await link.evaluate((node) => node.innerHTML)

  pageCount = parseInt(total.substring(1, total.length - 1))
  console.log(pageCount)
}

async function getOnePage(i) {
  await page.goto('https://boardgamegeek.com/browse/boardgame/page/' + i, {
    waitUntil: 'domcontentloaded',
  })

  if (i === pageCount) {
    await page.waitForTimeout(1000)

    let nameInput = await page.$('input[id="inputUsername"]')
    let passInput = await page.$('input[id="inputPassword"]')

    await nameInput.type(username, { delay: 50 })
    await passInput.type(password, { delay: 50 })

    let signButton = await page.$('button[type="submit"]')
    await signButton.click()

    await page.waitForTimeout(3000)
  } else {
    await page.waitForTimeout(setDelay)
  }

  console.log('\n--- We have navigated to page ' + i + ' ---\n')

  let games = await catalogue.parse(page)

  await saveGames(games)
}

function sleep(millis) {
  return new Promise((resolve) => setTimeout(resolve, millis))
}

async function saveGames(games) {
  return Promise.all(
    games.map(async (game) => {
      await sleep(200)
      if (await new GameModel(game.bggid, '').check(period))
        await saveGame(game)
    }),
  )
}

async function saveGame(game) {
  console.log('---fetching entry data for id: ' + game.bggid)
  const data = await gameDetails.getGameDetails(game)
  const stats = await gameDetails.getGameStats(game)

  const saveModel = new GameModel(
    data.objectid,
    data.name,
    data.yearpublished,
    data.minplayers,
    data.maxplayers,
    data.playingtime,
    data.minplaytime,
    data.maxplaytime,
    data.age,
    data.description,
    data.thumbnail,
    data.image, //Removed as BGG has string AND arrays in this field
    data.boardgameartist,
    data.boardgamemechanic,
    data.boardgamepublisher,
    data.boardgamecategory,
    data.boardgamedesigner,
    stats,
  )

  await saveModel.save()
}

async function getContent() {
  for (let i = pageCount; i > 0; i--) {
    await getOnePage(i)
  }
}

async function main() {
  browser = await puppeteer.launch({
    headless: false,
    ignoreHTTPSErrors: true,
  })

  page = await browser.newPage()

  await getPageCount()
  await getContent()

  await page.close()
  await browser.close()
}

main()
