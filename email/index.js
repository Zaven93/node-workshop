const nodemailer = require('nodemailer')

let transport = nodemailer.createTransport(
  {
    host: 'smtp.mail.ru',
    port: 465,
    secure: true,
    auth: {
      user: 'zaven.avanesyan93@mail.ru',
      pass: 'grant26082013'
    }
  },
  {
    from: 'Mailer Test, <zaven.avanesyan93@mail.ru>'
  }
)

module.exports = (message) => {
  return transport.sendMail(message, (err, info) => {
    if (err) {
      console.log(err)
    } else {
      console.log(info)
    }
  })
}
