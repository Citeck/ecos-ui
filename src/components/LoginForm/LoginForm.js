import React from 'react';
import classNames from 'classnames';
import { withRouter } from 'react-router';
import queryString from 'query-string';

import { t } from '../../helpers/util';

import styles from './LoginForm.module.scss';
import './LoginForm.scss';

class LoginForm extends React.Component {
  usernameInput = null;

  state = {
    username: '',
    password: ''
  };

  onChangeUsername = e => {
    this.setState({
      username: e.target.value
    });
  };

  onChangePassword = e => {
    this.setState({
      password: e.target.value
    });
  };

  componentDidMount() {
    this.usernameInput.focus();
  }

  render() {
    const { theme, location, logo } = this.props;
    const locationPath = location.pathname;
    const locationSearch = location.search;
    let searchParams = queryString.parse(locationSearch);

    let loginError = null;
    if (searchParams['error']) {
      loginError = <div className={styles.error}>{t('message.loginautherror')}</div>;
    }
    delete searchParams['error'];

    const successSearchString = queryString.stringify({ ...searchParams }, { sort: false });
    const failureSearchString = queryString.stringify({ ...searchParams, error: true }, { sort: false });
    let successUrl = `${locationPath}`;
    if (successSearchString) {
      successUrl += `?${successSearchString}`;
    }

    return (
      <div className={styles.wrapper}>
        <div className={styles.trademark} />

        <div className={classNames(`login-form-container login-form-container_theme_${theme}`)}>
          <div
            style={{
              background: `transparent url(${logo}) no-repeat`
            }}
            className={classNames(`login-company-logo login-company-logo_theme_${theme}`)}
          />
          {loginError}
          <form method="post" action="/share/page/dologin" className={classNames(`login-form login-form_theme_${theme}`)}>
            <input type="hidden" name="success" value={successUrl} />
            <input type="hidden" name="failure" value={`${locationPath}?${failureSearchString}`} />

            <div className={classNames(`login-form-field login-form-field_theme_${theme}`)}>
              <label>
                {t('label.username')}
                <br />
                <input
                  type="text"
                  name="username"
                  maxLength="255"
                  value={this.state.username}
                  onChange={this.onChangeUsername}
                  className={styles.input}
                  ref={el => (this.usernameInput = el)}
                />
              </label>
            </div>

            <div className={classNames(`login-form-field login-form-field_theme_${theme}`)}>
              <label>
                {t('label.password')}
                <br />
                <input
                  type="password"
                  name="password"
                  maxLength="255"
                  value={this.state.password}
                  onChange={this.onChangePassword}
                  className={styles.input}
                />
              </label>
            </div>

            <div className={styles.formField}>
              <button type="submit" className={classNames(`login-button login-button_theme_${theme}`)}>
                {t('button.login')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

export default withRouter(LoginForm);
