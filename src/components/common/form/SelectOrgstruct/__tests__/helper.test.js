import { renderUsernameString } from '../helpers';

describe('SelectOrgstruct helper functions', () => {
  it('renderUsernameString -> without template', () => {
    expect('').toEqual(renderUsernameString('', {}));
  });

  it('renderUsernameString -> with template', () => {
    // eslint-disable-next-line no-template-curly-in-string
    expect('Template: WithTemplate').toEqual(
      renderUsernameString('Template: ${example}', {
        example: 'WithTemplate'
      })
    );
  });

  it('renderUsernameString -> with deep object', () => {
    // eslint-disable-next-line no-template-curly-in-string
    expect('Template: WithTemplate').toEqual(
      renderUsernameString('Template: ${example.a}', {
        example: {
          a: 'WithTemplate'
        }
      })
    );
  });
});
