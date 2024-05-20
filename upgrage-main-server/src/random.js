let uniqueRandom
import("unique-random").then((module) => {
  uniqueRandom = module.default
})

module.exports.generateRandomNumber = () => {
  const min = 0
  const max = 1000000000000
  const randomNum = uniqueRandom(min, max)
  return Math.ceil(randomNum())
}
