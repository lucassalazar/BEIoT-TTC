const mongoose = require('mongoose')
const Schema = mongoose.Schema

// Create Schema
const TokenSchema = new Schema({
  token: String,
})

mongoose.model('tokens', TokenSchema)