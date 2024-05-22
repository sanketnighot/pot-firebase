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
const { count } = require("firebase/firestore")

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

  logger.info("Listening to events for bridge")

  let primaryCounter = 0
  let secondaryCounter = 0

  primaryWebSocketContract.on(
    "LockedNFT",
    async (nonce, user, nft, ids, time, event) => {
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
          nonce: nonce,
        }
        if (nft === "0x62ad80dEe8797E8Dc288e968f0643567aF92Aa70") {
          eventData.release_nft = "0x45b2A026091503FEc6D56574FdffF3Fbd644e9D1"
        }
        if (nft === "0x416c8020568aF93Ca4B3965cEdFC00b365eD791e") {
          eventData.release_nft = "0x64016988899D8F3A89B7380fb4A31F2c33Ec2E69"
        }
        // await addToFirebase("bridge", eventData).catch((error) => {
        //   logger.error(
        //     `Error storing in firebase --> ${event.log.transactionHash}`
        //   )
        //   logger.error("--------->")
        //   logger.error(error)
        //   logger.error("<---------")
        //   console.log(error)
        // })
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
    async (nonce, user, nft, ids, time, event) => {
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
          nonce: nonce,
        }
        if (nft === "0x45b2A026091503FEc6D56574FdffF3Fbd644e9D1") {
          eventData.release_nft = "0x62ad80dEe8797E8Dc288e968f0643567aF92Aa70"
        }
        if (nft === "0x64016988899D8F3A89B7380fb4A31F2c33Ec2E69") {
          eventData.release_nft = "0x416c8020568aF93Ca4B3965cEdFC00b365eD791e"
        }
        // await addToFirebase("bridge", eventData).catch((error) => {
        //   logger.error(
        //     `Error storing in firebase --> Sec:${event.log.transactionHash}`
        //   )
        //   logger.error("--------->")
        //   logger.error(error)
        //   logger.error("<---------")
        //   console.log(error)
        // })
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
    "LockedPOT",
    async (nonce, user, nft, ids, time, event) => {
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
          type: "pot",
          nonce: nonce,
          release_nft: "0xFC6747eFB3b88BebA006A5AD05A4f7A9FB7f79BC",
        }
        // await addToFirebase("bridge", eventData).catch((error) => {
        //   logger.error(
        //     `Error storing in firebase --> ${event.log.transactionHash}`
        //   )
        //   logger.error("--------->")
        //   logger.error(error)
        //   logger.error("<---------")
        //   console.log(error)
        // })
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
    "LockedPOT",
    async (nonce, user, nft, ids, time, event) => {
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
          type: "pot",
          nonce: nonce,
          release_nft: "0xECf98CAa6ff180008686a11F69c474Ca03314C72",
        }
        // await addToFirebase("bridge", eventData).catch((error) => {
        //   logger.error(
        //     `Error storing in firebase --> Sec:${event.log.transactionHash}`
        //   )
        //   logger.error("--------->")
        //   logger.error(error)
        //   logger.error("<---------")
        //   console.log(error)
        // })
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
    async (nonce, user, token, amount, time, event) => {
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
          nonce: nonce,
          release_token: "0x4C6a622878db94cD55d3cc30CF5dbe61c09D5e30",
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
    async (nonce, user, token, amount, time, event) => {
      try {
        logger.info(
          `Secondary LockedToken event received --> ${event.log.transactionHash}`
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
          nonce: nonce,
          release_token: "0x827d032ad5F5d46504a1e66b866Acd619cD43e3A",
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

  // const startBlockNumber = 19927075

  // const filter = secondaryWebSocketContract.filters.LockedNFT()
  // console.log(
  //   `Fetching past LockedNFT events from block ${startBlockNumber} to latest...`
  // )
  // const pastEvents = await secondaryWebSocketContract.queryFilter(
  //   filter,
  //   startBlockNumber,
  //   "latest"
  // )

  // let count = 1

  // await pastEvents.forEach(async (event) => {
  //   console.log(`Past event [${count}]`)
  //   count++

  //   try {
  //     logger.info(
  //       `Secondary LockedNFT event received --> ${event.transactionHash}`
  //     )
  //     const eventData = {
  //       user: event.args[1],
  //       nft: event.args[2],
  //       ids: event.args[3].map((id) => Number(id)),
  //       time: new Date(Number(event.args[4]) * 1000),
  //       requestBlockNumber: event.blockNumber,
  //       served: false,
  //       requestTransactionHash: event.transactionHash,
  //       chain: "secondary",
  //       type: "nft",
  //       nonce: "99999999999999999999999999",
  //       release_nft: "0x62ad80dEe8797E8Dc288e968f0643567aF92Aa70",
  //     }
  //     // await addToFirebase("bridge", eventData).catch((error) => {
  //     //   logger.error(
  //     //     `Error storing in firebase --> Sec:${event.transactionHash}`
  //     //   )
  //     //   logger.error("--------->")
  //     //   logger.error(error)
  //     //   logger.error("<---------")
  //     //   console.log(error)
  //     // })
  //     eventData.signer =
  //       secondaryCounter % 2 === 0
  //         ? primaryHttpContractWithSigner1
  //         : primaryHttpContractWithSigner2
  //     eventData.txnNonce =
  //       secondaryCounter % 2 === 0 ? primaryNonceCounter1 : primaryNonceCounter2
  //     if (secondaryCounter % 2 === 0) {
  //       primaryNonceCounter1++
  //     }
  //     if (secondaryCounter % 2 !== 0) {
  //       primaryNonceCounter2++
  //     }
  //     eventqueue.push(eventData, (error) => {
  //       if (error) {
  //         logger.error(`Error occured for --> ${nonce}`)
  //         logger.error("--------->")
  //         logger.error(error)
  //         logger.error("<---------")
  //       }
  //     })
  //     secondaryCounter++
  //   } catch (error) {
  //     logger.error(error)
  //     console.log(error)
  //   }
  // })
}

main()
