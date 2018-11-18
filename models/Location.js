const mongoose = require('mongoose')
const Schema = mongoose.Schema

// Create Schema
const LocationSchema = new Schema({
  token:{
    type: String,
    required: true
  },
  lat:{
    type: String,
    required: true
  },
  long:{
    type: String,
    required: true
  },
  date:{
    type: Date,
    default: Date.now
  }
})

mongoose.model('locations', LocationSchema)