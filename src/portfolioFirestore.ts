import {getApps, initializeApp} from 'firebase/app';
import {getFirestore} from 'firebase/firestore';
import config from '../firebase-applet-config.json';
const app=getApps()[0]||initializeApp(config);
export const portfolioDb=getFirestore(app,config.firestoreDatabaseId);
