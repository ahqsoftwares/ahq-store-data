
const admin = require("firebase-admin");
const fs = require("fs");
const {getFirestore} = require("firebase-admin/firestore");
const {getAuth} = require("firebase-admin/auth");
let users = [],
allApps = {},
apps = {},
homeScreen = [];

const app = admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.TOKEN)),
  databaseURL: "https://simple-host-api-default-rtdb.firebaseio.com"
});
const auth = getAuth(app);

const listAllUsers = async(nextPageToken) => {
  await auth
    .listUsers(1000, nextPageToken)
    .then(async(listUsersResult) => {
      listUsersResult.users.forEach((userRecord) => {
        users.push(userRecord.toJSON());
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

  ref.forEach((doc) => {
    console.log(doc.id);
    console.log(doc.data());
    allApps[doc.id] = doc.data();
    apps[doc.data().title] = doc.id;
  });

  fs.writeFile("./database/apps.json", JSON.stringify(allApps), (err) => {
    console.log(err || "Saved Apps list!");
  });
  fs.writeFile("./database/mapped.json", JSON.stringify(apps), (err) => {
    console.log(err || "Saved Apps name cache!");
  });

})()