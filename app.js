const fs = require('fs')
const http = require('http')
const https = require('https')
const express = require('express')
const path = require('path')
const exphbs = require('express-handlebars') // Express module for hb
const methodOverride = require('method-override')
const flash = require('connect-flash')
const session = require('express-session')
const bodyParser = require('body-parser')
const passport = require('passport')
const mongoose = require('mongoose')
const server = require('./server.js')

server.start()

const app = express() // Inicia a aplicação

const privateKey = fs.readFileSync('/etc/letsencrypt/live/{DNS}/privkey.pem', 'utf-8')
const certificate = fs.readFileSync('/etc/letsencrypt/live/{DNS}/cert.pem', 'utf-8')
const ca = fs.readFileSync('/etc/letsencrypt/live/{DNS}/chain.pem', 'utf-8')

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca
}

// Load Routes
const users = require('./routes/users')
const wsclient = require('./routes/wsclient')
const locations = require('./routes/locations')
const routes = require('./routes/routes')

// Passport Config
require('./config/passport')(passport)

// Connect to mongoose
mongoose.connect('mongodb://{MONGO_PATH}', {
  useNewUrlParser: true
})
.then(() => console.log('MongoDB Connected!'))
.catch(err => console.log(err))

// Handlebars Middleware
app.engine('handlebars', exphbs({
  defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Static folder
app.use(express.static(path.join(__dirname, 'public')))

// Method override middleware
app.use(methodOverride('_method'))

// Express-session middleware
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
  //cookie: { secure: true }
}))

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect-flash middleware
app.use(flash())

// Global variables middleware
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg')
  res.locals.error_msg = req.flash('error_msg')
  res.locals.error = req.flash('error')
  res.locals.user = req.user || null    // Variavel global para verifica se o login aconteceu
  next()
})

// Index Route
app.get('/', (req, res) => {
  const title = 'BEIoT-A'
  res.render('index', {
    title: title
  })
})

// About Route
app.get('/about', (req, res) => {
  res.render('about')
})

// Use Routes
app.use('/users', users)
app.use('/wsclient', wsclient)
app.use('/locations', locations)
app.use('/routes', routes)

const httpServer = http.createServer(function (req, res) {
  res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url })
  res.end();
})

const httpsServer = https.createServer(credentials, app)

httpServer.listen(80, () => {
  console.log('HTTP Server running on port 80.')
});

httpsServer.listen(443, () => {
  console.log('HTTPS Server running on port 443.')
})
