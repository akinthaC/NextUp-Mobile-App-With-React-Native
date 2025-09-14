import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { auth } from './firebase';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

// This should only be called on native platforms
if (typeof window === 'undefined') {
  WebBrowser.maybeCompleteAuthSession();
}

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '76950296712-rqjkjp5dc07ul0t4ak462n8e5nko6ua5.apps.googleusercontent.com',
    webClientId: '76950296712-usfar1tdcgiqd556imt6nsvfqapklvqv.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(() => console.log('Google login successful'))
        .catch((err) => console.log('Firebase login error:', err));
    }
  }, [response]);

  return { promptAsync, request };
}