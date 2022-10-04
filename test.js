let data = JSON.parse(`{"ufdQHNE1a2OgVQTBCyBR":{"repo":{"location":"simple-host-app","author":"ahqsoftwares"},"title":"Simple Host Desktop","appFinder":"-win.zip","img":"https://google.com","api":"%null%","author":{"id":"qReLhQSnIpQpyp6kUJ8gfx5BvE13","email":"ahqsecret@gmail.com","avatar":"https://firebasestorage.googleapis.com/v0/b/ahq-store.appspot.com/o/qReLhQSnIpQpyp6kUJ8gfx5BvE13%2Fprofile.png?alt=media&token=57e6a8c9-fc41-4a50-b741-bcf8604be232","displayName":"AHQ Store Official"},"description":"The simple host desktop app","download_url":"https://github.com/ahqsoftwares/Simple-Host-App/releases/download/v2.1.0/Simple-Host-Desktop-2.1.0-win.zip"}}`);
let map = JSON.parse(`{"Simple Host Desktop":"ufdQHNE1a2OgVQTBCyBR"}`);


function Search(key, map, heap) {
         const keys = Object.keys(map);
         const ids = Object.values(map);

         const matches = keys.filter((name) => name.toLowerCase().includes(key.toLowerCase())).map((name) => heap[ids[keys.findIndex((names) => names == name)]]);
         return matches;
}

console.log(Search("SimPLE", map, data));