import React from 'react';
import { COOKIE_KEY_LOCALE, COOKIE_KEY_LOCALE_MAX_AGE, getCurrentLocale, setCookie } from '../../common/util';

const LANGUAGE_RU = 'ru';
const LANGUAGE_EN = 'en';

export default class LanguageSwitcher extends React.Component {
  state = {
    language: null
  };

  componentDidMount() {
    this.setState({
      language: getCurrentLocale()
    });
  }

  render() {
    const { language } = this.state;

    if (!language) {
      return null;
    }

    return (
      <div onClick={this.switchLanguage} className="alfresco-header__language-switcher">
        <img src={`/share/res/components/images/language-flags/${language}.png`} alt={language} />
      </div>
    );
  }

  switchLanguage = () => {
    const { language: currentLanguage } = this.state;

    const language = currentLanguage === LANGUAGE_EN ? LANGUAGE_RU : LANGUAGE_EN;

    setCookie(COOKIE_KEY_LOCALE, language, { 'max-age': COOKIE_KEY_LOCALE_MAX_AGE });

    window.location.reload();
  };
}
