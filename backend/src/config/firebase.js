// const { initializeApp, getApps, cert } = require('firebase-admin/app');
// const { getMessaging } = require('firebase-admin/messaging');
// const serviceAccount = require('../../serviceAccountKey.json');

// if (!getApps().length) {
//   initializeApp({
//     credential: cert(serviceAccount),
//   });
// }

// module.exports = { getMessaging };



const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');

if (!getApps().length) {
  // Render pe file nahi hoti — env variable se lo
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  initializeApp({
    credential: cert(serviceAccount),
  });
}

module.exports = { getMessaging };