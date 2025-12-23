import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import toast from "react-hot-toast";

const AuthContext = createContext();

// YOUR SPECIFIC ADMIN UID
const ADMIN_UID = "W6nHxXwnxORoMzwp5hx4GY3dZws1";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          // DIRECT CHECK: Is this YOU?
          if (currentUser.uid === ADMIN_UID) {
            setUser(currentUser);
          } else {
            // If someone else tries to log in, kick them out
            await signOut(auth);
            setUser(null);
            if (window.location.pathname !== '/login') {
                toast.error("Access Denied: You are not the Admin.");
            }
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth Check Failed:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, ADMIN_UID }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);