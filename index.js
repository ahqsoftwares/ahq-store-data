
const admin = require("firebase-admin");
const {getFirestore} = require("firebase-admin/firestore");
const {getAuth} = require("firebase-admin/auth");

const app = admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.TOKEN)),
  databaseURL: "https://simple-host-api-default-rtdb.firebaseio.com"
});

const listAllUsers = async(nextPageToken) => {
  await getAuth(app)
    .listUsers(1000, nextPageToken)
    .then(async(listUsersResult) => {
      listUsersResult.users.forEach((userRecord) => {
        console.log('user', userRecord.toJSON());
      });
      if (listUsersResult.pageToken) {
        // List next batch of users.
        await listAllUsers(listUsersResult.pageToken);
      }
    })
    .catch((error) => {
      console.log('Error listing users:', error);
    });
};

const db = getFirestore(app);

(async() => {
  await listAllUsers();
  const ref = await db.collection("apps").get();
  console.log("Working");
  ref.forEach((doc) => {
    console.log(doc.id);
    console.log(doc.data());
  });
  console.log("done!");
})()