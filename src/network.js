// import firebase login github
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

import { doc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCtXUVbb9sG1DxxcsNPQG0QPKhy45k18CM",
  authDomain: "crib-6d386.firebaseapp.com",
  projectId: "crib-6d386",
  storageBucket: "crib-6d386.appspot.com",
  messagingSenderId: "684228931797",
  appId: "1:684228931797:web:e852f4e4f31ce88c4bb25c",
  databaseURL: "https://crib-6d386.firebaseio.com",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export const auth = firebase.auth;
export const db = firebase.firestore();

export const loginWithGithub = ()=>
  auth().signInWithPopup( new auth.GithubAuthProvider() );

export const loadBoards = userId=>
  Promise.all([
    db.collection('boards')
      .where('p1', '==', userId).get()
      .then(snap => snap.docs),

    db.collection('boards')
      .where('p2', '==', userId).get()
      .then(snap => snap.docs),

    db.collection('boards')
      .where('p1', '==', '').get()
      .then(snap => snap.docs),

    db.collection('boards')
      .where('p2', '==', '').get()
      .then(snap => snap.docs),

  ]).then(g => g.flat().map(game => ({ ...game.data(), id: game.id })) );


export const joinGame = ({ boardId, userId, asPlayer })=>
  db.collection('boards')
    .doc(boardId)
    .update({ [asPlayer]: userId });

export const createGame = board=> db.collection('boards').add(board);

export const updateGame = (boardId, board) => db.collection('boards').doc(boardId).update(board);

let cbs = [];
export const subGame = (boardId, cb)=> {
  cbs.push(cb);
  
  const unsub = onSnapshot(doc(db, 'boards', boardId), (doc) => {
    cbs.forEach(c=> c(doc.data()));
  });

  return ()=> {
    cbs = cbs.filter(c => c !== cb);
    unsub();
  };
};
