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
    if (task.type === "token") {
      const txn = await task.signer.releaseTokens(
        task.nonce,
        task.user,
        task.release_token,
        task.amount,
        {
          nonce: task.txnNonce,
        }
      )
      await txn.wait()
      const eventData = {
        user: task.user,
        token: task.token,
        amount: task.amount,
        time: task.time,
        requestBlockNumber: task.requestBlockNumber,
        served: true,
        requestTransactionHash: task.requestTransactionHash,
        responseBlockNumber: txn.blockNumber,
        responseTransactionHash: txn.hash,
        chain: task.chain,
        type: "token",
        nonce: task.nonce,
        release_token: task.release_token,
      }
      // await addToFirebase("bridge", eventData)
      // await updateServedBlock(task.requestBlockNumber)

      return logger.info(
        `Transaction sent for --> ${task.requestTransactionHash}`
      )
    }
    if (task.type === "nft") {
      const txn = await task.signer.releaseNFTs(
        task.nonce,
        task.user,
        [task.release_nft, task.ids],
        {
          nonce: task.txnNonce,
        }
      )
      await txn.wait()
      const eventData = {
        user: task.user,
        nft: task.nft,
        ids: task.ids,
        time: task.time,
        requestBlockNumber: task.requestBlockNumber,
        served: true,
        requestTransactionHash: task.requestTransactionHash,
        responseBlockNumber: txn.blockNumber,
        responseTransactionHash: txn.hash,
        chain: task.chain,
        type: "nft",
        nonce: task.nonce,
        release_nft: task.release_nft,
      }
      // await addToFirebase("bridge", eventData)
      // await updateServedBlock(task.requestBlockNumber)

      return logger.info(
        `Transaction sent for --> ${task.requestTransactionHash}`
      )
    }

    if (task.type === "pot") {
      console.log(task)
      const txn = await task.signer.releasePOTs(
        Number(task.nonce),
        task.user,
        [task.release_nft, task.ids],
        {
          nonce: task.txnNonce,
        }
      )
      await txn.wait()
      const eventData = {
        user: task.user,
        nft: task.nft,
        ids: task.ids,
        time: task.time,
        requestBlockNumber: task.requestBlockNumber,
        served: true,
        requestTransactionHash: task.requestTransactionHash,
        responseBlockNumber: txn.blockNumber,
        responseTransactionHash: txn.hash,
        chain: task.chain,
        type: "pot",
        nonce: task.nonce,
        release_nft: task.release_nft,
      }
      // await addToFirebase("bridge", eventData)
      // await updateServedBlock(task.requestBlockNumber)

      return logger.info(
        `Transaction sent for --> ${task.requestTransactionHash}`
      )
    }
  } catch (error) {
    logger.error(`Error occured for --> ${task.requestTransactionHash}`)
    logger.error("--------->")
    logger.error(error)
    logger.error("<---------")
    console.log(error)
  }
}, 2)
