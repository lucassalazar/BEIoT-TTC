const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const {ensureAuthenticated} = require('../helpers/auth')
const path = require('path');


// Load Idea Model
require('../models/Location')
const Location = mongoose.model('locations')

router.use(express.static(path.join(__dirname, '../views/wsclient')))

// Wsclient Index Page
router.get('/', ensureAuthenticated, (req, res) => {
  Location.find({token: req.user.token}) 
    .sort({date:'desc'})
    .then(locations => {
      res.render('wsclient/index', {
        locations: locations
      })
    }) 
  console.log(req.user.token)
})

module.exports = router