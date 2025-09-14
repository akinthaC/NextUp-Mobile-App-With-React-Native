import { auth, db } from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  User 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_KEY = "loginTime";
const SESSION_DURATION = 1000 * 60 * 60 * 24 * 7; // 7 days

// REGISTER
export const Register = async (email: string, password: string, username: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  // Create user doc in Firestore
  await setDoc(doc(db, "users", userCredential.user.uid), {
    username,
    email,
    role: "customer",
    createdAt: new Date()
  });

  return userCredential.user;
};

// LOGIN
export const login = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);

  await AsyncStorage.setItem(SESSION_KEY, Date.now().toString());
  return userCredential.user;
};

// LOGOUT
export const Logout = async () => {
  await signOut(auth);
  await AsyncStorage.removeItem(SESSION_KEY);
};

// SESSION CHECK
export const isSessionExpired = async () => {
  const loginTime = await AsyncStorage.getItem(SESSION_KEY);
  if (!loginTime) return true;

  const now = Date.now();
  return now - Number(loginTime) > SESSION_DURATION;
};

// GET USER ROLE
export const getUserRole = async (uid: string) => {
  const userDoc = await getDoc(doc(db, "users", uid));
  return userDoc.data()?.role || null;
};
