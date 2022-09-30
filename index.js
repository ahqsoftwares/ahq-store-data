
const admin = require("firebase-admin");
const fs = require("fs");
const fetch = require("node-fetch");
const {getFirestore} = require("firebase-admin/firestore");
const {getAuth} = require("firebase-admin/auth");
let users = {},
allApps = {},
unparsedApps = [],
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
        const {
          email,
          photoURL,
          displayName
        } = userRecord.toJSON();
        
        users[userRecord.uid] = {
          email,
          avatar: photoURL,
          displayName
        };
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

// Save Lists
(async() => {
  await listAllUsers();
  const ref = await db.collection("apps").get();

  ref.forEach(async(doc) => {
    unparsedApps.push(doc);
  });

  for (const doc of unparsedApps) {
    const data = doc.data();
    
    let filtered = {
      ...data,
      author: {
        id: data.author,
        ...users[data.author]
      }
    }

    try {
      const repoReleases = await fetch(`https://api.github.com/repos/${data.repo.author}/${data.repo.location}/releases/latest`).then(async(data)=> await data.json()).then((json) => json.assets);
      const downloadUri = repoReleases.filter(({name}) => name.endsWith(data.appFinder))[0]["browser_download_url"];

      filtered["download_url"] = downloadUri;
      
      allApps[doc.id] = filtered;
    
      apps[doc.data().title] = doc.id;
    } catch (e) {
      console.log("An App didn't got updated");
    }
  }

  // Id - Data Map
  fs.writeFile("./database/apps.json", JSON.stringify(allApps), (err) => {
    console.log(err || "Saved Apps list!");
  });

  // Name - Id map
  fs.writeFile("./database/mapped.json", JSON.stringify(apps), (err) => {
    console.log(err || "Saved Apps name cache!");
  });

})()