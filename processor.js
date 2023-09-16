// returns top genres
const topGenres = (genres, num) => {
  let counts = []

  for (let i = 0; i < genres.length; i++) {
    counts[i] = {}
  }

  for (let i = 0; i < genres.length; i++) {
    genres[i].forEach((genre) => {
      let key = false
      counts.forEach((dictionary) => {
        if (genre in dictionary && !key) {
          dictionary[genre] += genres.length - i
          key = true
        }
      })
      if (!key) {
        counts[i][genre] = genres.length - i
      }
    })
  }
  return reduce(counts, num)
}

// reduces each dictionary to one highest element
const reduce = (counts, num) => {
  let champions = {}
  counts.forEach((dictionary) => {
    let max = -Infinity
    let genre = ""
    for (key in dictionary) {
      if (dictionary[key] > max) {
        max = dictionary[key]
        genre = key
      }
    }
    champions[genre] = max
  })
  return topKeys(champions, num)
}

// finds keys with the highest value in dictionary
const topKeys = (dictionary, num) => {
  const entries = Object.entries(dictionary)
  entries.sort((a, b) => b[1] - a[1])
  const topEntries = entries.slice(0, num)
  const topKeys = topEntries.map((entry) => entry[0])
  return topKeys
}

module.exports = {
  topGenres,
}
