const toCurrency = (price) => {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency'
  }).format(price)
}

const toDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(date))
}

document.querySelectorAll('.price').forEach((node) => {
  node.textContent = toCurrency(node.textContent)
})

document.querySelectorAll('.date').forEach((node) => {
  node.textContent = toDate(node.textContent)
})

const $card = document.querySelector('#card')
if ($card) {
  $card.addEventListener('click', (event) => {
    console.log('Event from target', event)
    if (event.target.classList.contains('js-remove')) {
      const id = event.target.dataset.id
      const csrf = event.target.dataset.csrf

      console.log('Event from js-remove', event)

      fetch('/card/remove/' + id, {
        method: 'delete',
        headers: {
          'X-XSRF-TOKEN': csrf
        }
      })
        .then((res) => res.json())
        .then((card) => {
          console.log('Card', card)
          if (card.courses.length) {
            const html = card.courses
              .map(
                (course) =>
                  `
                <tr>
                <td>${course.title}</td>
                <td>${course.count}</td>
                <td>
                    <button class="btn btn-small js-remove" data-id="${course.id}">Remove</button>
                </td>
                </tr>
                `
              )
              .join('')
            $card.querySelector('tbody').innerHTML = html
            $card.querySelector('.price').textContent = toCurrency(card.price)
          } else {
            $card.innerHTML = '<p>The card is empty</p>'
          }
        })
        .catch((err) => console.log(err))
    }
  })
}

M.Tabs.init(document.querySelectorAll('.tabs'))
