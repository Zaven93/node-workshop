const { Router } = require('express')
const router = Router()
const Course = require('../models/course')
const auth = require('../middleware/auth')

function isOwner(course, req) {
  return course.userId.toString() === req.user._id.toString()
}

router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().populate('userId', 'email name')

    console.log(courses)

    res.render('courses', {
      title: 'Courses',
      isCourses: true,
      userId: req.user ? req.user._id.toString() : null,
      courses
    })
  } catch (error) {
    console.log(error)
  }
})

router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
    res.render('course', {
      layout: 'empty.hbs',
      title: `Course ${course.name}`,
      course
    })
  } catch (error) {
    console.log(error)
  }
})

router.get('/:id/edit', auth, async (req, res) => {
  if (!req.query.allow) {
    res.redirect('/')
  }

  try {
    const course = await Course.findById(req.params.id)

    if (!isOwner(course, req)) {
      return res.redirect('/courses')
    }

    res.render('edit', {
      title: `Course ${course.title}`,
      course
    })
  } catch (error) {
    console.log(error)
  }
})

router.post('/edit', auth, async (req, res) => {
  try {
    const { id } = req.body
    delete req.body.id
    const course = await Course.findById(id)

    if (!isOwner(course, req)) {
      return res.redirect('/courses')
    }
    Object.assign(course, req.body)
    await course.save()
    res.redirect('/courses')
  } catch (error) {
    console.log(error)
  }
})

router.post('/remove', auth, async (req, res) => {
  try {
    await Course.deleteOne({ _id: req.body.id, userId: req.user._id })

    res.redirect('/courses')
  } catch (error) {
    console.log(error)
  }
})

module.exports = router
