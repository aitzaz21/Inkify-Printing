import { GoogleLogin } from '@react-oauth/google';

/**
 * GoogleButton — uses the official GoogleLogin component which returns
 * `credential` (id_token JWT) directly. This matches what the backend
 * `verifyIdToken()` expects.
 *
 * onSuccess(idToken: string) — caller receives the raw id_token string
 * onError(message: string)
 */
export default function GoogleButton({ onSuccess, onError, label = 'Continue with Google' }) {
  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          const idToken = credentialResponse.credential;
          if (!idToken) {
            onError?.('Google sign-in failed — no credential returned.');
            return;
          }
          onSuccess(idToken);
        }}
        onError={() => {
          onError?.('Google sign-in was cancelled or failed.');
        }}
        useOneTap={false}
        theme="filled_black"
        size="large"
        text={label === 'Sign up with Google' ? 'signup_with' : 'signin_with'}
        shape="rectangular"
        width="360"
      />
    </div>
  );
}
