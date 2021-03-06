const dataPoint = require('../').create()
const _ = require('lodash')

dataPoint.addEntities({
  'source:getOrgInfo': {
    url: 'https://api.github.com/orgs/{value}',
    beforeRequest: (acc, next) => {
      // acc.value holds reference to source.options
      const options = _.assign({}, acc.value, {
        headers: {
          'User-Agent': 'DataPoint'
        }
      })

      next(null, options)
    }
  }
})

dataPoint.transform('source:getOrgInfo', 'nodejs').then(acc => {
  console.log(acc.value)
  // entire result from https://api.github.com/orgs/nodejs
})
