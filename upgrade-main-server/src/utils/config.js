require("dotenv").config()

module.exports.primaryHttpRpc = `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY1}`
module.exports.primaryWsRpc = `wss://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY1}`
module.exports.primaryContractAddress =
  "0xECf98CAa6ff180008686a11F69c474Ca03314C72"

module.exports.secondaryHttpRpc = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY2}`
module.exports.secondaryWsRpc = `wss://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY2}`
module.exports.secondaryContractAddress =
  "0xFC6747eFB3b88BebA006A5AD05A4f7A9FB7f79BC"
