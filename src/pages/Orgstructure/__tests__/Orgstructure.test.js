import React from 'react';
import { shallow, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { unmountComponentAtNode } from 'react-dom';
import { Provider } from 'react-redux';

import Orgstructure from '../Orgstructure';
import { initialState } from '../../../reducers/orgstructure';
import configureStore from '../../../store';

configure({ adapter: new Adapter() });

const renderWithRedux = (component, initialState) => {
  const store = configureStore(null, { orgstructure: initialState });

  return (
    <Provider store={store}>
      <Orgstructure />
    </Provider>
  );
};
let container = null;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  unmountComponentAtNode(container);
  container.remove();
  container = null;
});

describe('<Orgstructure />', () => {
  it('render without selected recordRef', () => {
    const component = shallow(renderWithRedux(<Orgstructure />, initialState));

    expect(component).toMatchSnapshot();
  });

  it('render with selected recordRef', () => {
    const component = shallow(renderWithRedux(<Orgstructure />, { id: 'emodel/person@bryzadmin' }));

    expect(component).toMatchSnapshot();
  });
});
