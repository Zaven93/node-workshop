process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const express = require('express')
const path = require('path')
const csrf = require('csurf')
const flash = require('connect-flash')
const session = require('express-session')
const MongoStore = require('connect-mongodb-session')(session)
const mongoose = require('mongoose')
const helmet = require('helmet')
const exphbs = require('express-handlebars')
const Handlebars = require('handlebars')
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access')
const keys = require('./keys')
const mainRoute = require('./routes/main')
const addRoute = require('./routes/add')
const coursesRoute = require('./routes/courses')
const cardRoute = require('./routes/card')
const ordersRoute = require('./routes/orders')
const authRoute = require('./routes/auth')
const profileRoute = require('./routes/profile')
const varMiddleware = require('./middleware/variables')
const userMiddleware = require('./middleware/user')
const errorHandler = require('./middleware/error')
const fileMiddleware = require('./middleware/file')

const app = express()

const hbs = exphbs.create({
  defaultLayout: 'main',
  extname: 'hbs',
  handlebars: allowInsecurePrototypeAccess(Handlebars),
  helpers: require('./utils/hbs-helpers')
})

const store = new MongoStore({
  collection: 'session',
  uri: keys.MONGODB_URI
})

//Creating handlebars engine
app.engine('hbs', hbs.engine)

//Registring handlebars engine
app.set('view engine', 'hbs')

app.set('views', 'views')

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'images')))
app.use(express.urlencoded({ extended: true }))
app.use(
  session({
    secret: keys.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store
  })
)
app.use(fileMiddleware.single('avatar'))
app.use(csrf())
app.use(flash())
// app.use(helmet())
app.use(varMiddleware)
app.use(userMiddleware)

const PORT = process.env.PORT || 3000

app.use('/', mainRoute)
app.use('/add', addRoute)
app.use('/courses', coursesRoute)
app.use('/card', cardRoute)
app.use('/orders', ordersRoute)
app.use('/auth', authRoute)
app.use('/profile', profileRoute)

app.use(errorHandler)

async function start() {
  try {
    await mongoose.connect(keys.MONGODB_URI, {
      useNewUrlParser: true,
      useFindAndModify: true,
      useUnifiedTopology: true
    })
    console.log('Database connected successfully')

    await app.listen(PORT)
    console.log(`Server is listening on port: ${PORT}`)
  } catch (error) {
    console.log(error)
  }
}

start()
