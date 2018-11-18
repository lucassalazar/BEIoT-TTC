const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const {ensureAuthenticated} = require('../helpers/auth')
// Destructuring
const path = require('path');


// Load Location Model
require('../models/Location')
const Location = mongoose.model('locations')

// Load User Model
require('../models/User')
const User = mongoose.model('users')

router.use(express.static(path.join(__dirname, '../views/locations')))

// Location Index Page
router.get('/', ensureAuthenticated, (req, res) => {
  Location.find({token: req.user.token})          // Busca no banco de dados e retorna uma promisse
    .sort({date:'desc'})
    .then(locations => { 
      res.render('locations/index', {
        locations: locations
      })
    })
})

// Delete Location
router.delete('/:id', ensureAuthenticated, (req, res) => {
  Location.deleteOne({
    _id: req.params.id
  })
  .then(() => {
    req.flash('success_msg', 'Location removed')
    res.redirect('/locations')
  })
})

module.exports = router