const { Router } = require('express')
const auth = require('../middleware/auth')
const User = require('../models/user')
const router = Router()

router.get('/', async (req, res) => {
  res.render('profile', {
    title: 'Profile',
    isProfile: true,
    user: req.user.toObject()
  })
})

router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    const toChange = {
      name: req.body.name
    }

    console.log('File is here', req.file)

    console.log('Path', req.file.path.substr(7))
    console.log('Type of path', typeof req.file.path)

    if (req.file) {
      toChange.avatarUrl = req.file.path.substr(7)
    }

    Object.assign(user, toChange)
    await user.save()
    res.redirect('/profile')
  } catch (error) {
    console.log(error)
  }
})

module.exports = router
