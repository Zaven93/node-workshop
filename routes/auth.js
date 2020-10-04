const { Router } = require('express')
const crypto = require('crypto')
const { validationResult } = require('express-validator/check')
const router = Router()
const User = require('../models/user')
const bcrypt = require('bcryptjs')
const sendEmail = require('../email')
const { registerValidators } = require('../utils/validators')

router.get('/login', (req, res) => {
  res.render('auth/login', {
    title: 'Authorization',
    isLogin: true,
    loginError: req.flash('loginError'),
    registerError: req.flash('registerError')
  })
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    const candidate = await User.findOne({ email })

    console.log('Found candidate', candidate)

    if (candidate) {
      const arePasswordsMatch = await bcrypt.compare(password, candidate.password)

      if (arePasswordsMatch) {
        req.session.user = candidate
        req.session.isAuthenticated = true
        req.session.save((err) => {
          if (err) {
            throw err
          }
          res.redirect('/')
        })
      } else {
        req.flash('loginError', 'Wrong password')
        res.redirect('/auth/login#login')
      }
    } else {
      req.flash('loginError', "User doesn't exist")
      res.redirect('/auth/login#login')
    }
  } catch (error) {
    console.log(error)
  }
})

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login#login')
  })
})

router.post('/register', registerValidators, async (req, res) => {
  try {
    const { email, password, name } = req.body

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      req.flash('registerError', errors.array()[0].msg)
      return res.status(422).redirect('/auth/login#register')
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = new User({
      name,
      email,
      password: hashedPassword,
      cart: { items: [] }
    })
    await user.save()
    res.redirect('/auth/login#login')
    const message = {
      to: email,
      subject: 'Registration confirmation',
      text: "You've registered successfully"
    }
    await sendEmail(message)
    console.log('Email is sent')
  } catch (error) {
    console.log(error)
  }
})

router.get('/reset', (req, res) => {
  res.render('auth/reset', {
    title: 'Reset password',
    error: req.flash('error')
  })
})

router.post('/reset', (req, res) => {
  try {
    crypto.randomBytes(32, async (err, buffer) => {
      if (err) {
        req.flash('error', 'Something went wrong, please try later')
        res.redirect('/auth/reset')
      }

      const token = buffer.toString('hex')

      const candidate = await User.findOne({ email: req.body.email })

      if (candidate) {
        candidate.resetToken = token
        candidate.resetTokenExp = Date.now() + 60 * 60 * 1000

        await candidate.save()

        const message = {
          to: req.body.email,
          subject: 'Reset password',
          html: `
            <h1>Forgot password?</h1>
            <p>If no, ignore this email</p>
            <p>Otherwise press the link below</p>
            <p><a href="http://localhost:3000/auth/password/${token}">Reset password</a></p>
          `
        }

        await sendEmail(message)

        res.redirect('/auth/login')
      } else {
        req.flash('error', "Email doesn't exist")
        res.redirect('/auth/reset')
      }
    })
  } catch (error) {
    console.log(error)
  }
})

router.get('/password/:token', async (req, res) => {
  if (!req.params.token) {
    res.redirect('/auth/login')
    console.log('There is no token')
  }

  try {
    const user = await User.findOne({
      resetToken: req.params.token,
      resetTokenExp: { $gt: Date.now() }
    })

    if (!user) {
      res.redirect('/auth/login')
      console.log('There is no user')
    } else {
      res.render('auth/password', {
        title: 'Create New Password',
        error: req.flash('error'),
        userId: user._id.toString(),
        token: req.params.token
      })
    }
  } catch (error) {
    console.log(error)
  }
})

router.post('/password', async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.body.userId,
      resetToken: req.body.token,
      resetTokenExp: { $gt: Date.now() }
    })

    if (user) {
      user.password = await bcrypt.hash(req.body.password, 10)
      user.resetToken = undefined
      user.resetTokenExp = undefined

      await user.save()
      res.redirect('/auth/login')
    } else {
      req.flash('loginError', 'Token is expired')
      res.redirect('/auth/login')
    }
  } catch (error) {
    console.log(error)
  }
})

module.exports = router
