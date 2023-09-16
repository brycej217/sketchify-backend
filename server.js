// express
require("dotenv").config()
const express = require("express")
const app = express()
const port = 3000
const axios = require("axios")

// oauth
const querystring = require("querystring")
const states = new Set()
const cors = require("cors")
app.use(cors())

// replicate
const Replicate = require("replicate")
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})
const model =
  "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf"
const redirect_uri = `http://localhost:${port}/callback`

// modules
const utils = require("./utils.js")
const processor = require("./processor.js")

// rendering

// generates and returns redirect url to spotify authorization page
app.get("/api/login", async (req, res) => {
  console.log("Request received to /api/login")
  try {
    let state = utils.generateState(16) // generate security state
    states.add(state) // push state to states set for future validation
    let scope = "user-top-read" // request account details and top songs/artists
    const url =
      "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: process.env.CLIENT_ID,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state,
      })
    res.send(url)
  } catch (error) {
    console.log(`ERROR ${error}`)
    res.status(500).json({ error: "Internal Server Error" })
  }
})

// request access token from spotify api using client credentials and generate image
app.get("/callback", async (req, res) => {
  try {
    const { code, state } = req.query
    if (states.has(state)) {
      console.log("Callback successful")
      const authHeader = `Basic ${Buffer.from(
        `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`
      ).toString("base64")}`
      let response = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri,
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
        }),
        {
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      )
      let data = await response.data
      data = await top(data.access_token)

      // process spotiy data to find top genres
      let genreList = []
      data.items.forEach((item) => {
        genreList.push(item.genres) // push each genre list to a list
      })

      // calculate the top genres and create prompt
      topGenres = processor.topGenres(genreList, 5)
      prompt = topGenres.join(", ")
      image = await generate(prompt)
      res.redirect(`http://localhost:3001/sketch?image=${image}&prompt=${prompt}`)
    } else {
      res.status(403).json({ error: "Invalid state parameter received" })
    }
  } catch (error) {
    console.log(`ERROR ${error}`)
    res.status(500).json({ error: "Internal Server Error" })
  }
})

// retrieve user's top items using access token
const top = async (access_token) => {
  let response = await axios.get(
    `https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=50`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  )
  let data = response.data
  return data
}

const generate = async (genres) => {
  console.log("generating...")
  const input = {
    prompt: `A visual representation of the blend of ${genres} music.`,
  }
  const output = await replicate.run(model, { input })
  return output
}

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`)
})
