const { join } = require('path')
const { readdirSync } = require('fs')

const { generateDocs } = require('./docs/generateDocs')

const ROOT_DIRECTORY = join(__dirname, '..')

generateDocs(ROOT_DIRECTORY)

console.log()
console.log('Done!')
console.log()
