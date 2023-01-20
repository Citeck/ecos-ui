/* eslint-disable no-template-curly-in-string */
import { renderUsernameString, isHTML } from '../helpers';

describe('SelectOrgstruct helper functions', () => {
  describe('renderUsernameString function', () => {
    it('without template', () => {
      expect('').toEqual(renderUsernameString('', {}));
    });

    it('with template', () => {
      // eslint-disable-next-line no-template-curly-in-string
      expect('Template: WithTemplate').toEqual(
        renderUsernameString('Template: ${example}', {
          example: 'WithTemplate'
        })
      );
    });

    it('with deep object', () => {
      // eslint-disable-next-line no-template-curly-in-string
      expect('Template: WithTemplate').toEqual(
        renderUsernameString('Template: ${example.a}', {
          example: {
            a: 'WithTemplate'
          }
        })
      );
    });

    it('with html string', () => {
      // eslint-disable-next-line no-template-curly-in-string
      expect('Admin: Admin<p style="display:block">(admin)</p>').toEqual(
        renderUsernameString('${firstName}: ${firstName}<p style="display:block">(${username})</p>', {
          username: 'admin',
          firstName: 'Admin'
        })
      );
    });

    it('with html string', () => {
      // eslint-disable-next-line no-template-curly-in-string
      expect('Admin <span style="color:#7396cd;font-size:bold;text-decoration:underline;">admin</span>').toEqual(
        renderUsernameString('${firstName} <span style="color:#7396cd;font-size:bold;text-decoration:underline;">${username}</span>', {
          username: 'admin',
          firstName: 'Admin'
        })
      );
    });
  });

  describe('isHTML function', () => {
    it('not HTML, empty string', () => {
      expect(isHTML('')).toBeFalsy();
    });

    it('not HTML, plain string', () => {
      expect(isHTML('hello world!')).toBeFalsy();
    });

    it('not HTML, masked string', () => {
      expect(isHTML('Hello, ${firstName} ${lastName}!')).toBeFalsy();
    });

    it('HTML string test 1', () => {
      expect(isHTML('Hello <span style="display: block; color:#fff">world!</span>')).toBeTruthy();
    });

    it('HTML string test 2', () => {
      expect(isHTML('${firstName} <span style="color:#7396cd;font-size:bold;text-decoration:underline;">${username}</span>')).toBeTruthy();
    });

    it('HTML string test 3', () => {
      expect(isHTML('<div>${email} <span style="color:#fff;">(${userName})</span></div>')).toBeTruthy();
    });
  });
});
