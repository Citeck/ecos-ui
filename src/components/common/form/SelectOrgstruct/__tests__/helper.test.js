/* eslint-disable no-template-curly-in-string */
import { renderUsernameString } from '../helpers';

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
});
