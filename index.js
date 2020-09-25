const functions = require("firebase-functions");

const algoliasearch = require("algoliasearch");
const dotenv = require("dotenv");
const firebase = require("firebase");

// load values from the .env file in this directory into process.env
dotenv.config();

// configure firebase
firebase.initializeApp({
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});
const database = firebase.database();

// configure algolia
const algolia = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_API_KEY
);
const index = algolia.initIndex(process.env.ALGOLIA_INDEX_NAME);

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

// exports.helloWorld = functions.database
//   .ref("Edubase/chat/{chatRoomId}/chats/{chatId}")
//   .on((request, response) => {
//     functions.logger.info("Hello logs!", { structuredData: true });
//     response.send("Hello from Firebase!");
//   });

exports.deleteOldItems = functions.database
  .ref("Edubase/chat/{chatRoomId}/chats/{chatId}")
  .onWrite((change, context) => {
    var ref = change.after.ref.parent;

    var cutoff = Date.now() - 30 * 1000;

    var oldItemsQuery = ref.orderByChild("tm").endAt(cutoff);

    return oldItemsQuery.once("value", (snapshot) => {
      var updates = {};
      snapshot.forEach((child) => {
        updates[child.key] = null;
      });

      return ref.update(updates);
    });
  });

exports.sendToAlgolia = functions.database
  .ref("Edubase/users")
  .onWrite((change, context) => {
    const childData = {
      name: change.val().name,
      dp: change.val().dp,
      clg: change.val().clg,
      online: change.val().online,
    };

    childData.objectID = Object.keys(change)[0];

    index
      .saveObjects(records)
      .then(() => {
        console.log("Contacts imported into Algolia");
        return;
      })
      .catch((error) => {
        console.error("Error when importing contact into Algolia", error);
        process.exit(1);
      });
  });
