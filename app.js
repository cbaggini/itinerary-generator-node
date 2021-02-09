const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())

const port = 3000

app.get('/', (req, res) => {
  res.send('Welcome to the itinerary generator!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})