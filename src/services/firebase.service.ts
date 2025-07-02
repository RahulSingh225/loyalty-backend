import admin, { storage } from 'firebase-admin';

interface FirebaseConfig {
  projectId: string;
  privateKey: string;
  clientEmail: string;
  storageBucket: string;
}

class FirebaseService {
  private storage: storage.Storage;

  constructor(config: FirebaseConfig) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.projectId,
        privateKey: config.privateKey.replace(/\\n/g, '\n'),
        clientEmail: config.clientEmail
      }),
      storageBucket: config.storageBucket
    });
    this.storage = admin.storage();
  }

  getStorage(): storage.Storage {
    return this.storage;
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    return await admin.auth().verifyIdToken(idToken);
  }

  async storeSession(userId: string, mobileNumber: string): Promise<void> {
    await admin.firestore().collection('sessions').doc(userId).set({
      user_id: parseInt(userId),
      mobile_number: mobileNumber,
      login_time: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  
}




export default FirebaseService;