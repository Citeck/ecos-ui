import { getSessionData, setSessionData } from './ls';

function goToLogin() {
  window.location.replace('/login');
}

export default class Token {
  static save = token => setSessionData('tokenData', token);

  static get = () => getSessionData('tokenData');

  static check = () => {
    let tokenData = Token.get();
    let notExist = !tokenData || Date.now() >= (tokenData && tokenData.expires_on) * 1000;

    if (notExist) {
      goToLogin();
    }

    return notExist;
  };
}
