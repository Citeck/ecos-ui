import React from 'react';
import { withRouter } from 'react-router';
import queryString from 'query-string';
import { t } from '../../helpers/util';
import styles from './LoginForm.module.scss';

class LoginForm extends React.Component {
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

  render() {
    const locationPath = this.props.location.pathname;
    const locationSearch = this.props.location.search;
    let searchParams = queryString.parse(locationSearch);

    let loginError = null;
    if (searchParams['error']) {
      loginError = <div className={styles.error}>{t('message.loginautherror')}</div>;
    }
    delete searchParams['error'];

    const successSearchString = queryString.stringify({ ...searchParams }, { sort: false });
    const failureSearchString = queryString.stringify({ ...searchParams, error: true }, { sort: false });

    return (
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <div className="theme-company-logo logo-com" />
          {loginError}
          <form method="post" action="/share/page/dologin" className={styles.form}>
            <input type="hidden" name="success" value={`${locationPath}?${successSearchString}`} />
            <input type="hidden" name="failure" value={`${locationPath}?${failureSearchString}`} />

            <div className="form-field">
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
                />
              </label>
            </div>

            <div className="form-field">
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

            <div className="form-field">
              <button type="submit" className={styles.button}>
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
