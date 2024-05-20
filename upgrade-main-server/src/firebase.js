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
    const docRef = doc(collectionRef, data.nonce.toString())

    // Set the document data
    await setDoc(docRef, data)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}

module.exports.updateServedBlock = async (nonce, blockNumber) => {
  try {
    // Check if nonce and blockNumber are defined
    if (typeof nonce === "undefined" || typeof blockNumber === "undefined") {
      console.error("Invalid parameters: nonce and blockNumber must be defined")
      return false
    }

    const collectionRef = collection(db, "lastUpgradeServedMain")
    const blockRef = doc(collectionRef, "blockNumber")
    const nonceRef = doc(collectionRef, "nonce")

    // Set the document data

    await setDoc(blockRef, { blockNumber: blockNumber })
    await setDoc(nonceRef, { nonce: nonce })

    return true
  } catch (error) {
    console.error(error)
    return false
  }
}

module.exports.fetchFromFirebase = async (collectionName, id) => {
  try {
    // Create a query against the collection
    const queryData = query(
      collection(db, collectionName),
      where("id", "==", id)
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
