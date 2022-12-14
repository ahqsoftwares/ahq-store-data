
const admin = require("firebase-admin");
const fs = require("fs");
const {emptyDirSync} = require("fs-extra");
const fetch = require("node-fetch");
const {getFirestore} = require("firebase-admin/firestore");
const {getAuth} = require("firebase-admin/auth");
let users = {},
allApps = {},
unparsedApps = [],
apps = {},
nonParsedHomeScreen = [],
searchMap = [],
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
        
        try {
          if (displayName.startsWith("(dev)")) {
            users[userRecord.uid] = {
              email,
              avatar: photoURL,
              displayName: displayName.replace("(dev)", ""),
              apps: []
            };
          }
        } catch (e) {
          console.log(e);
        }
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
   emptyDirSync("./database");
  
  await listAllUsers();
  const ref = await db.collection("apps").get();

  ref.forEach(async(doc) => {
    unparsedApps.push(doc);
  });

  for (const doc of unparsedApps) {
    const data = doc.data();
    if (users[data.author]) {
      users[data.author].apps.push(doc.id);
    }

    let filtered = {
      ...data,
      author: {
        id: data.author,
        name: users[data.author]?.name
      }
    }

    try {
      const repoData = await fetch(`https://api.github.com/repos/${data.repo.author}/${data.repo.location}/releases/latest`).then(async(data)=> await data.json());
      const version = repoData.tag_name;
      const repoReleases = repoData.assets;
      const downloadUri = repoReleases.filter(({name}) => name.endsWith(data.appFinder))[0]["browser_download_url"];

      filtered["version"] = version;
      filtered["download_url"] = downloadUri;
      
      if (users[data.author]) {
        allApps[doc.id] = filtered;
        apps[doc.data().title] = doc.id;
        searchMap.push({
          name: doc.data().title,
          id: doc.id
        });
        fs.writeFile(`./database/${doc.id}.json`, JSON.stringify(filtered), (err) => {
          if (err) {
            console.log(`Custom File Failed`);
          }
        });
      } else {
        await db.doc(`apps/${doc.id}`).delete();
        fs.rm(`./database/${doc.id}.json`, (err) => {
          if (err) {
            console.log(`Got some error while deleting ${doc.id}`);
          }
        });
        console.log("Deleted document with id: " + doc.id);
      }
    } catch (e) {
      console.log(e);
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

  // Id - User map
  fs.writeFile("./database/users.json", JSON.stringify(users), (err) => {
    console.log(err || "Saved Developers List");
  });

  // Search Map
  fs.writeFile("./database/search.json", JSON.stringify(searchMap), (err) => {
    console.log(err || "Saved Search Map");
  });

  //ID - User Lazy Map
  for (let i = 0; i < Object.keys(users).length; i++) {
    const id = Object.keys(users)[i];
    const user = users[id];

    fs.writeFile(`./database/user${id}.json`, JSON.stringify(user), (err) => {
      console.log(err || "Saved Developers List");
    });
  }

  // Home Screen Data Fetch
  const home = await db.collection("home").get().catch(() => process.exit(1));
  home.forEach((doc) => nonParsedHomeScreen.push(doc));

  for (const document of nonParsedHomeScreen) {
    let {
      name,
      apps
    } = document.data();

    let checked = [];

    for (const app of apps) {
      if (allApps[app]) {
        checked.push(app);
      }
    }

    if (apps.length !== checked.length) {
      if (checked.length == 0) {
        await db.doc(`home/${document.id}`).set({
          name,
          apps: checked
        });
      } else {
        await db.doc(`home/${document.id}`).delete();
      }
      console.log(`Deleted some refs from deleted apps`);
    }

    homeScreen.push([name, [...checked]]);
  }

  fs.writeFile("./database/home.json", JSON.stringify(homeScreen), (err) => {
    console.log(err || "Saved Home Screen Apps");
  });
})()
