import React from 'react';
import { connect } from 'react-redux';
import styles from './LoginForm.module.scss';
import { tryLoginRequest } from '../../actions/user';

const mapDispatchToProps = dispatch => ({
  tryLoginRequest: (username, password) => {
    dispatch(tryLoginRequest({ username, password }));
  }
});

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

  onFormSubmit = e => {
    e.preventDefault();
    this.props.tryLoginRequest(this.state.username, this.state.password);
  };

  render() {
    const loginError = <div className={styles.error}>Some error text</div>;

    return (
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <div className="theme-company-logo logo-com" />
          {loginError}
          <form onSubmit={this.onFormSubmit} method="post" action="/share/page/dologin" className={styles.form}>
            <div className="form-field">
              <label>
                Логин
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
                Пароль
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
                Войти
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

// TODO withRouter
/*
<input type="hidden" name="success" value="/share/page/user/admin/dashboard" />
<input type="hidden" name="failure" value="/share/page/user/admin/dashboard?error=true" />
*/
export default connect(
  null,
  mapDispatchToProps
)(LoginForm);
