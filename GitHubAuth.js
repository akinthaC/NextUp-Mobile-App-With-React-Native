import * as AuthSession from "expo-auth-session";
import { auth } from "./firebase";
import { GithubAuthProvider, signInWithCredential } from "firebase/auth";

const CLIENT_ID = "Ov23lih47HrPyawEVbMB";
const CLIENT_SECRET = "c41d840ebb672c64191b05219e74bfb260727342";


export function useGitHubAuth() {
  const redirectUri = makeRedirectUri({ useProxy: true });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: ["read:user"],
      redirectUri,
      responseType: ResponseType.Code,
    },
    { authorizationEndpoint: "https://github.com/login/oauth/authorize" }
  );

  useEffect(() => {
    if (response?.type === "success") {
      const code = response.params.code;

      (async () => {
        const tokenResponse = await fetch(
          `https://github.com/login/oauth/access_token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&code=${code}`,
          { method: "POST", headers: { Accept: "application/json" } }
        );

        const { access_token } = await tokenResponse.json();
        if (access_token) {
          const credential = GithubAuthProvider.credential(access_token);
          signInWithCredential(auth, credential)
            .then(() => console.log("GitHub login success"))
            .catch(console.error);
        }
      })();
    }
  }, [response]);

  return { promptAsync, request };
}