const helper = require("./helper");

const express = require('express')
const cors = require('cors')
const bodyParser = require("body-parser");

const app = express()
app.use(cors())
app.use(bodyParser.json())

const port = 3000

app.get('/', (req, res) => {
  res.send('Welcome to the itinerary generator!')
})

app.get('/geocode', (req, res) => {
	helper.geocode(req.query.text)
	.then(response => res.send(response))
	.catch(err => res.send(err));	
})

app.post('/itinerary', (req, res) => {
	helper.getRoute(req.body.coordinates, req.body.radius, req.body.categories)
	.then(response => res.send(response))
	.catch(err => res.send(err));	
})

app.listen(port, () => {
  console.log(`Itinerary app listening at http://localhost:${port}`)
})