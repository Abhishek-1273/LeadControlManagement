const { initializeApp, cert, getApps } = require('firebase-admin/app');

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}