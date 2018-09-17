const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI)

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

var Schema = mongoose.Schema
var personSchema = new Schema({
  name: {
    type: String,
    default: "",
    unique: true,
    required: true
  },
  exercises: [
    {
      description: String,
      duration: Number,
      date: Date
    }
  ]
})

var Person = mongoose.model('Person', personSchema);

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/exercise/users', (req, res) => {
  Person.find({}, (err, person) => {
    if (err)
      console.log(err)
    res.send(person)
  })
})

app.get('/api/exercise/log', (req, res) => {
  Person.find({
    _id: req.query.userId
  }, function(err, person) {
    if (err)
      console.log(err)
    var startDate = req.query.from == undefined
      ? new Date(1000, 1, 1).getTime()
      : new Date(req.query.from).getTime()
    var endDate = req.query.to == undefined
      ? new Date().getTime()
      : new Date(req.query.to).getTime()
    var limit = req.query.limit
    var myExercise = []
    for (let i = 0; i < person[0].exercises.length; i++) {
      if (person[0].exercises[i].date.getTime() >= startDate && person[0].exercises[i].date.getTime() <= endDate) {
        myExercise.push(person[0].exercises[i])
      }
    }
    myExercise = myExercise.slice(0, limit)
    var count = {
      'Total exercise count': myExercise.length
    }
    person[0].exercises = myExercise
    person.push(count)
    res.send(person)
  })
})

app.post('/api/exercise/new-user', (req, res) => {
  var record = {
    name: req.body.username
  }
  var person = new Person(record)
  person.save((err, data) => {
    if (err) {
      console.log(err)
      res.send("Username is already taken")
    } else {
      res.send(person)
    }
  })
})

app.post('/api/exercise/add', (req, res) => {
  var updateObj = {}
  updateObj.description = req.body.description
  updateObj.duration = req.body.duration
  updateObj.date = req.body.date === ""
    ? new Date()
    : new Date(req.body.date)

  Person.findById(req.body.userId, function(err, person) {
    if (err)
      return console.log(err)
    person.exercises.push(updateObj);
    person.save(function(err, updatedPerson) {
      if (err)
        return console.log(err);
      res.send(updatedPerson);
    })
  })
});

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode,
    errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt').send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
