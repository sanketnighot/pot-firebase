const ethers = require("ethers")
const {
  primaryHttpRpc,
  primaryWsRpc,
  primaryContractAddress,
  secondaryHttpRpc,
  secondaryWsRpc,
  secondaryContractAddress,
} = require("./utils/config.js")
const ABI = require("./utils/ContractAbi/abi.json")
const { addToFirebase, fetchFromFirebase } = require("./firebase.js")
const { logger } = require("./utils/winston.js")
const { eventqueue } = require("./ethereum.js")
const { generateRandomNumber } = require("./random.js")

require("dotenv").config()

const main = async () => {
  // # Primary Chain
  const primaryWebSocketProvider = new ethers.WebSocketProvider(primaryWsRpc)
  const primaryWebSocketContract = new ethers.Contract(
    primaryContractAddress,
    ABI,
    primaryWebSocketProvider
  )
  const primaryHttpProvider = new ethers.JsonRpcProvider(primaryHttpRpc)
  const primaryHttpContract = new ethers.Contract(
    primaryContractAddress,
    ABI,
    primaryHttpProvider
  )
  const primaryWallet1 = new ethers.Wallet(
    process.env.PRIVATE_KEY_1,
    primaryHttpProvider
  )
  const primaryHttpContractWithSigner1 =
    primaryHttpContract.connect(primaryWallet1)
  const primaryWallet2 = new ethers.Wallet(
    process.env.PRIVATE_KEY_2,
    primaryHttpProvider
  )
  const primaryHttpContractWithSigner2 =
    primaryHttpContract.connect(primaryWallet2)

  let primaryNonceCounter1 = await primaryHttpProvider.getTransactionCount(
    primaryWallet1.address
  )
  let primaryNonceCounter2 = await primaryHttpProvider.getTransactionCount(
    primaryWallet2.address
  )

  // # Secondary Chain
  const secondaryWebSocketProvider = new ethers.WebSocketProvider(
    secondaryWsRpc
  )
  const secondaryWebSocketContract = new ethers.Contract(
    secondaryContractAddress,
    ABI,
    secondaryWebSocketProvider
  )
  const secondaryHttpProvider = new ethers.JsonRpcProvider(secondaryHttpRpc)
  const secondaryHttpContract = new ethers.Contract(
    secondaryContractAddress,
    ABI,
    secondaryHttpProvider
  )
  const secondaryWallet1 = new ethers.Wallet(
    process.env.PRIVATE_KEY_1,
    secondaryHttpProvider
  )
  const secondaryHttpContractWithSigner1 =
    secondaryHttpContract.connect(secondaryWallet1)
  const secondaryWallet2 = new ethers.Wallet(
    process.env.PRIVATE_KEY_2,
    secondaryHttpProvider
  )
  const secondaryHttpContractWithSigner2 =
    secondaryHttpContract.connect(secondaryWallet2)

  let secondaryNonceCounter1 = await secondaryHttpProvider.getTransactionCount(
    secondaryWallet1.address
  )
  let secondaryNonceCounter2 = await secondaryHttpProvider.getTransactionCount(
    secondaryWallet2.address
  )

  logger.info("Listening to events for upgrade Nfts")

  let primaryCounter = 0
  let secondaryCounter = 0

  primaryWebSocketContract.on(
    "RequestForUpdate",
    async (nonce, owner, nftId, safety, event) => {
      try {
        logger.info(`LockedNFT event received --> ${event.log.transactionHash}`)
        const randomNumber = await generateRandomNumber()
        const eventData = {
          nonce: Number(nonce),
          owner: owner,
          nftId: Number(nftId),
          safety: safety,
          requestBlockNumber: event.log.blockNumber,
          served: false,
          requestTransactionHash: event.log.transactionHash,
          randomNumber: randomNumber,
        }
        // await addToFirebase("upgrades", eventData).catch((error) => {
        //   logger.error(`Error storing in firebase --> ${nonce}`)
        //   logger.error("--------->")
        //   logger.error(error)
        //   logger.error("<---------")
        //   console.log(error)
        // })
        eventData.signer =
          primaryCounter % 2 === 0
            ? primaryHttpContractWithSigner1
            : primaryHttpContractWithSigner2
        eventData.txnNonce =
          primaryCounter % 2 === 0 ? primaryNonceCounter1 : primaryNonceCounter2
        if (primaryCounter % 2 === 0) {
          primaryNonceCounter1++
        }
        if (primaryCounter % 2 === 1) {
          primaryNonceCounter1++
        }
        eventqueue.push(eventData, (error) => {
          if (error) {
            logger.error(`Error occured for --> ${nonce}`)
            logger.error("--------->")
            logger.error(error)
            logger.error("<---------")
          }
        })
        primaryCounter++
      } catch (error) {
        logger.error(error)
      }
    }
  )

  secondaryWebSocketContract.on(
    "RequestForUpdate",
    async (nonce, owner, nftId, safety, event) => {
      try {
        logger.info(`LockedNFT event received --> ${event.log.transactionHash}`)
        const randomNumber = await generateRandomNumber()
        const eventData = {
          nonce: Number(nonce),
          owner: owner,
          nftId: Number(nftId),
          safety: safety,
          requestBlockNumber: event.log.blockNumber,
          served: false,
          requestTransactionHash: event.log.transactionHash,
          randomNumber: randomNumber,
        }
        // await addToFirebase("upgrades", eventData).catch((error) => {
        //   logger.error(`Error storing in firebase --> ${nonce}`)
        //   logger.error("--------->")
        //   logger.error(error)
        //   logger.error("<---------")
        //   console.log(error)
        // })
        eventData.signer =
          secondaryCounter % 2 === 0
            ? secondaryHttpContractWithSigner1
            : secondaryHttpContractWithSigner2
        eventData.txnNonce =
          secondaryCounter % 2 === 0
            ? secondaryNonceCounter1
            : secondaryNonceCounter2
        if (secondaryCounter % 2 === 0) {
          secondaryNonceCounter1++
        }
        if (secondaryCounter % 2 === 1) {
          secondaryNonceCounter1++
        }
        eventqueue.push(eventData, (error) => {
          if (error) {
            logger.error(`Error occured for --> ${nonce}`)
            logger.error("--------->")
            logger.error(error)
            logger.error("<---------")
          }
        })
        secondaryCounter++
      } catch (error) {
        logger.error(error)
      }
    }
  )
}

main()
