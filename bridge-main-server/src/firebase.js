const { initializeApp } = require("firebase/app")
const {
  getFirestore,
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
} = require("firebase/firestore")

const firebaseConfig = require("./utils/firebaseConfig.json")

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

module.exports.addToFirebase = async (collectionName, data) => {
  try {
    const collectionRef = collection(db, collectionName)

    // Use the doc function to get a reference to the document within the collection
    const docRef = doc(collectionRef, data.requestTransactionHash)

    // Set the document data
    await setDoc(docRef, data)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}

module.exports.updateServedBlock = async (blockNumber) => {
  try {
    // Check if nonce and blockNumber are defined
    if (typeof blockNumber === "undefined") {
      console.error("Invalid parameters: blockNumber must be defined")
      return false
    }

    const collectionRef = collection(db, "lastBridgeServedMain")
    const blockRef = doc(collectionRef, "blockNumber")

    // Set the document data

    await setDoc(blockRef, { blockNumber: blockNumber })

    return true
  } catch (error) {
    console.error(error)
    return false
  }
}
module.exports.fetchFromFirebase = async (
  collectionName,
  requestTransactionHash
) => {
  try {
    // Create a query against the collection
    const queryData = query(
      collection(db, collectionName),
      where("requestTransactionHash", "==", requestTransactionHash)
    )

    // Execute the query
    const snapshot = await getDocs(queryData)

    // Map over the documents in the snapshot
    return snapshot.docs.map((doc) => doc.data())
  } catch (error) {
    console.log(error)
    return []
  }
}
