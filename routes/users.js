const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const passport = require('passport')
const router = express.Router()

// Load User Model
require('../models/User')
const User = mongoose.model('users')

//Load Token Model
require('../models/Token')
const Token = mongoose.model('tokens')

// User Login Route
router.get('/login', (req, res) => {
  res.render('users/login')
})

// User Register Route
router.get('/register', (req, res) => {
  res.render('users/register')
})

// Login Form POST
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
})


// Register Form Post
router.post('/register', (req, res) => {
  let errors = []

  if (!req.body.token) {
    errors.push({ text: 'Please add your token.' })
  }

  if (req.body.token.length != 18) {
    errors.push({ text: 'Invalid token.' })
  }

  if (!req.body.name) {
    errors.push({ text: 'Please add a name.' })
  }

  if (req.body.name.length < 4) {
    errors.push({ text: 'Name must have at least 4 characters.' })
  }

  if (!req.body.email) {
    errors.push({ text: 'Please add an email.' })
  }

  if (req.body.password != req.body.password2) {
    errors.push({ text: 'Passwords do not match.' })
  }

  if (req.body.password.length < 4) {
    errors.push({ text: 'Password must have at least 4 characters.' })
  }
  if (errors.length > 0) {
    res.render('users/register', {
      errors: errors,
      token: req.body.token,
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      password2: req.body.password2
    })
  } else {
    User.findOne({ token: req.body.token })
      .then(token => {
        if (token) {
          req.flash('error_msg', 'Token already registered')
          res.redirect('/users/register')
        } else {
          Token.findOne({ token: req.body.token })
            .then(token => {
              if (token) {
                User.findOne({ email: req.body.email }) // Verifica a existência do email
                  .then(user => {
                    if (user) {
                      req.flash('error_msg', 'Email already registered')
                      res.redirect('/users/register')
                    } else {
                      const newUser = new User({
                        token: req.body.token,
                        name: req.body.name,
                        email: req.body.email,
                        password: req.body.password
                      })
                      bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(newUser.password, salt, (err, hash) => {
                          if (err) throw err
                          newUser.password = hash
                          newUser.save()
                            .then(user => {
                              req.flash('success_msg', 'You are now registered and can log in!')
                              res.redirect('/users/login')
                            })
                            .catch(err => {
                              console.log(err)
                              return
                            })
                        })
                      })
                    }
                  })
              } else {
                req.flash('error_msg', 'Token não encontrada.')
                res.redirect('/users/register')
              }
            })
        }
      })
  }
})

// Logout User
router.get('/logout', (req, res) => {
  req.logout()
  req.flash('success_msg', 'You are logged out')
  res.redirect('/users/login')
})

module.exports = router