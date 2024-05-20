const ethers = require("ethers")
const { httpRpc, wsRpc, contractAddress } = require("./utils/config.js")
const ABI = require("./utils/ContractAbi/abi.json")
const { addToFirebase, fetchFromFirebase } = require("./firebase.js")
const { logger } = require("./utils/winston.js")
const { eventqueue } = require("./ethereum.js")
const { generateRandomNumber } = require("./random.js")

require("dotenv").config()

const main = async () => {
  const webSocketProvider = new ethers.WebSocketProvider(wsRpc)
  const webSocketContract = new ethers.Contract(
    contractAddress,
    ABI,
    webSocketProvider
  )
  const httpProvider = new ethers.JsonRpcProvider(httpRpc)
  const httpContract = new ethers.Contract(contractAddress, ABI, httpProvider)
  const wallet1 = new ethers.Wallet(process.env.PRIVATE_KEY_1, httpProvider)
  const httpContractWithSigner1 = httpContract.connect(wallet1)
  const wallet2 = new ethers.Wallet(process.env.PRIVATE_KEY_2, httpProvider)
  const httpContractWithSigner2 = httpContract.connect(wallet2)

  let nonceCounter1 = await httpProvider.getTransactionCount(wallet1.address)
  let nonceCounter2 = await httpProvider.getTransactionCount(wallet2.address)
  logger.info("Listening to events for upgrades")

  let counter = 0

  webSocketContract.on(
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
        await addToFirebase("upgrades", eventData).catch((error) => {
          logger.error(`Error storing in firebase --> ${nonce}`)
          logger.error("--------->")
          logger.error(error)
          logger.error("<---------")
          console.log(error)
        })
        eventData.signer =
          counter % 2 === 0 ? httpContractWithSigner1 : httpContractWithSigner2
        eventData.txnNonce = counter % 2 === 0 ? nonceCounter1 : nonceCounter2
        if (counter % 2 === 0) {
          nonceCounter1++
        }
        if (counter % 2 === 1) {
          nonceCounter2++
        }
        eventqueue.push(eventData, (error) => {
          if (error) {
            logger.error(`Error occured for --> ${nonce}`)
            logger.error("--------->")
            logger.error(error)
            logger.error("<---------")
          }
        })
        counter++
      } catch (error) {
        logger.error(error)
      }
    }
  )
}

main()
