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
const { addToFirebase } = require("./firebase.js")
const { logger } = require("./utils/winston.js")
const { eventqueue } = require("./ethereum.js")

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

  logger.info("Listening to events")

  let primaryCounter = 0
  let secondaryCounter = 0

  primaryWebSocketContract.on(
    "LockedNFT",
    async (user, nft, ids, time, event) => {
      try {
        logger.info(
          `Primary LockedNFT event received --> ${event.log.transactionHash}`
        )
        const eventData = {
          user: user,
          nft: nft,
          ids: ids.map((id) => Number(id)),
          time: new Date(Number(time) * 1000),
          requestBlockNumber: event.log.blockNumber,
          served: false,
          requestTransactionHash: event.log.transactionHash,
          chain: "primary",
          type: "nft",
        }
        await addToFirebase("bridge", eventData).catch((error) => {
          logger.error(
            `Error storing in firebase --> ${event.log.transactionHash}`
          )
          logger.error("--------->")
          logger.error(error)
          logger.error("<---------")
          console.log(error)
        })
        eventData.signer =
          primaryCounter % 2 === 0
            ? secondaryHttpContractWithSigner1
            : secondaryHttpContractWithSigner2
        eventData.txnNonce =
          primaryCounter % 2 === 0
            ? secondaryNonceCounter1
            : secondaryNonceCounter2
        if (primaryCounter % 2 === 0) {
          secondaryNonceCounter1++
        }
        if (primaryCounter % 2 !== 0) {
          secondaryNonceCounter2++
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
        console.log(error)
      }
    }
  )

  secondaryWebSocketContract.on(
    "LockedNFT",
    async (user, nft, ids, time, event) => {
      try {
        logger.info(
          `Secondary LockedNFT event received --> ${event.log.transactionHash}`
        )
        const eventData = {
          user: user,
          nft: nft,
          ids: ids.map((id) => Number(id)),
          time: new Date(Number(time) * 1000),
          requestBlockNumber: event.log.blockNumber,
          served: false,
          requestTransactionHash: event.log.transactionHash,
          chain: "secondary",
          type: "nft",
        }
        await addToFirebase("bridge", eventData).catch((error) => {
          logger.error(
            `Error storing in firebase --> Sec:${event.log.transactionHash}`
          )
          logger.error("--------->")
          logger.error(error)
          logger.error("<---------")
          console.log(error)
        })
        eventData.signer =
          secondaryCounter % 2 === 0
            ? primaryHttpContractWithSigner1
            : primaryHttpContractWithSigner2
        eventData.txnNonce =
          secondaryCounter % 2 === 0
            ? primaryNonceCounter1
            : primaryNonceCounter2
        if (secondaryCounter % 2 === 0) {
          primaryNonceCounter1++
        }
        if (secondaryCounter % 2 !== 0) {
          primaryNonceCounter2++
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
        console.log(error)
      }
    }
  )

  primaryWebSocketContract.on(
    "LockedToken",
    async (user, token, amount, time, event) => {
      try {
        logger.info(
          `Primary LockedToken event received --> ${event.log.transactionHash}`
        )
        const eventData = {
          user: user,
          token: token,
          amount: Number(amount),
          time: new Date(Number(time) * 1000),
          requestBlockNumber: event.log.blockNumber,
          served: false,
          requestTransactionHash: event.log.transactionHash,
          chain: "primary",
          type: "token",
        }
        await addToFirebase("bridge", eventData).catch((error) => {
          logger.error(
            `Error storing in firebase --> ${event.log.transactionHash}`
          )
          logger.error("--------->")
          logger.error(error)
          logger.error("<---------")
          console.log(error)
        })
        eventData.signer =
          primaryCounter % 2 === 0
            ? secondaryHttpContractWithSigner1
            : secondaryHttpContractWithSigner2
        eventData.txnNonce =
          primaryCounter % 2 === 0
            ? secondaryNonceCounter1
            : secondaryNonceCounter2
        if (primaryCounter % 2 === 0) {
          secondaryNonceCounter1++
        }
        if (primaryCounter % 2 !== 0) {
          secondaryNonceCounter2++
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
        console.log(error)
      }
    }
  )

  secondaryWebSocketContract.on(
    "LockedToken",
    async (user, token, amount, time, event) => {
      try {
        logger.info(
          `Secondary LockedNFT event received --> ${event.log.transactionHash}`
        )
        const eventData = {
          user: user,
          token: token,
          amount: Number(amount),
          time: new Date(Number(time) * 1000),
          requestBlockNumber: event.log.blockNumber,
          served: false,
          requestTransactionHash: event.log.transactionHash,
          chain: "secondary",
          type: "token",
        }
        await addToFirebase("bridge", eventData).catch((error) => {
          logger.error(
            `Error storing in firebase --> Sec:${event.log.transactionHash}`
          )
          logger.error("--------->")
          logger.error(error)
          logger.error("<---------")
          console.log(error)
        })
        eventData.signer =
          secondaryCounter % 2 === 0
            ? primaryHttpContractWithSigner1
            : primaryHttpContractWithSigner2
        eventData.txnNonce =
          secondaryCounter % 2 === 0
            ? primaryNonceCounter1
            : primaryNonceCounter2
        if (secondaryCounter % 2 === 0) {
          primaryNonceCounter1++
        }
        if (secondaryCounter % 2 !== 0) {
          primaryNonceCounter2++
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
        console.log(error)
      }
    }
  )
}

main()
