require("dotenv").config()

module.exports.chainId = 1
module.exports.httpRpc = `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`
module.exports.wsRpc = `wss://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`
module.exports.contractAddress = "0xECf98CAa6ff180008686a11F69c474Ca03314C72"
