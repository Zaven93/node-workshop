const { Router } = require('express')
const Course = require('../models/course')
const router = Router()
const auth = require('../middleware/auth')

function mapCartItems(cart) {
  return cart.items.map((c) => ({
    ...c.courseId._doc,
    id: c.courseId.id,
    count: c.count
  }))
}

function computePrice(courses) {
  return courses.reduce((total, course) => (total += course.price * course.count), 0)
}

router.post('/add', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.body.id)

    await req.user.addToCart(course)

    res.redirect('/card')
  } catch (error) {
    console.log(error)
  }
})

router.get('/', auth, async (req, res) => {
  try {
    const user = await req.user.populate('cart.items.courseId').execPopulate()

    const courses = mapCartItems(user.cart)

    console.log('Price', courses)

    res.render('card', {
      title: 'Card',
      isCard: true,
      courses: courses,
      price: computePrice(courses)
    })
  } catch (error) {
    console.log(error)
  }
})

router.delete('/remove/:id', auth, async (req, res) => {
  try {
    await req.user.removeFromCart(req.params.id)
    const user = await req.user.populate('cart.items.courseId').execPopulate()

    const courses = mapCartItems(user.cart)
    const cart = {
      courses,
      price: computePrice(courses)
    }

    res.status(200).json(cart)
  } catch (error) {
    res.status(500).send({ error: 'Some error occured' })
  }
})

module.exports = router
