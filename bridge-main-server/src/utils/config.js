require("dotenv").config()

module.exports.primaryHttpRpc = `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY1}`
module.exports.primaryWsRpc = `wss://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY1}`
module.exports.primaryContractAddress =
  "0xc9d19e1D9f1CE58F8410fd0F462CcB1697B2808d"

module.exports.secondaryHttpRpc = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY2}`
module.exports.secondaryWsRpc = `wss://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY2}`
module.exports.secondaryContractAddress =
  "0x7483e01C12735DA6F2585639eB9386b7D0Abd493"
