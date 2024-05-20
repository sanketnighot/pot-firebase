const ethers = require("ethers")
const ABI = require("./utils/ContractAbi/abi.json")
const {
  addToFirebase,
  fetchFromFirebase,
  updateServedBlock,
} = require("./firebase.js")
const { logger } = require("./utils/winston.js")
const asyncLib = require("async")
const {
  chainId,
  httpRpc,
  wsRpc,
  contractAddress,
} = require("./utils/config.js")

module.exports.eventqueue = asyncLib.queue(async (task, completed) => {
  try {
    const txn = await task.signer.updateNftForUser(
      task.nonce,
      task.owner,
      task.nftId,
      task.safety,
      task.randomNumber,
      { nonce: task.txnNonce, gasLimit: 1000000, gasPrice: 150000000000 }
    )
    await txn.wait()
    const eventData = {
      nonce: task.nonce,
      owner: task.owner,
      nftId: task.nftId,
      safety: task.safety,
      requestBlockNumber: task.requestBlockNumber,
      responseBlockNumber: txn.blockNumber,
      served: true,
      requestTransactionHash: task.requestTransactionHash,
      responseTransactionHash: txn.hash,
      randomNumber: task.randomNumber,
    }
    await addToFirebase("upgrades", eventData)
    await updateServedBlock(task.nonce, task.requestBlockNumber)

    return logger.info(`Transaction sent for --> ${task.nonce}`)
  } catch (error) {
    logger.error(`Error occured for --> ${task.nonce}`)
    logger.error("--------->")
    logger.error(error)
    logger.error("<---------")
    console.log(error)
  }
}, 2)
