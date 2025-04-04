import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

import DevToolsConverter from '../../../dto/devTools';
import { Labels as BuildLabels } from '../Build/Build';
import { BuildContextProvider } from '../Build/BuildContext';
import { CommitsContextProvider } from '../Commits/CommitsContext';
import { getRepoProject, parseTasksLinks, getHostName } from '../Commits/helpers';
import { Labels as DevModulesLabels } from '../DevModules/DevModules';
import { DevModulesContextProvider } from '../DevModules/DevModulesContext';
import * as DevToolsContext from '../DevToolsContext';
import ErrorText from '../ErrorText';
import Loader from '../Loader';
import { SettingsContextProvider } from '../Settings/SettingsContext';
import TabContent from '../TabContent';
import Tabs from '../Tabs';
import { input1, output1, input2, output2, input3_4, output3, output4 } from '../__fixtures__/DevTools.fixtures';

const { JIRA, BITBUCKET } = require('../Commits/constants');

const { TABS } = require('@/pages/DevTools/constants');

describe('DevTools tests', () => {
  describe('DevToolsConverter', () => {
    it('fetchAlfrescoModulesList', () => {
      expect(DevToolsConverter.fetchAlfrescoModulesList(input1)).toEqual(output1);
    });
    it('fetchSystemModulesList', () => {
      expect(DevToolsConverter.fetchSystemModulesList(input2)).toEqual(output2);
    });
    it('fetchRepos', () => {
      expect(DevToolsConverter.fetchRepos(input3_4)).toEqual(output3);
    });
    it('normalizeCommits', () => {
      expect(DevToolsConverter.normalizeCommits(input3_4)).toEqual(output4);
    });
  });

  describe('Commits helpers', () => {
    it('getRepoProject', () => {
      expect(getRepoProject('git@bitbucket.org:citeck/ecos-ui.git')).toEqual('citeck/ecos-ui');
      expect(getRepoProject('git@bitbucket.org:citeck/ecos-uiserv.git')).toEqual('citeck/ecos-uiserv');
      expect(getRepoProject('git@gitlab.citeck.ru:ecos-ui.git')).toEqual('ecos-ui');
    });
    it('getHostName', () => {
      expect(getHostName(BITBUCKET)).toEqual('bitbucket.org');
      expect(getHostName('git@bitbucket.org:citeck-projects/ecos-ui.git')).toEqual('bitbucket.org');
      expect(getHostName('git@gitlab.citeck.ru:citeck-uiserv/ecos-ui.git')).toEqual('gitlab.citeck.ru');
    });
    it('parseTasksLinks', () => {
      const input1 = 'ECOSCOM-3940 - category-document-type does not have "Delete" and "View in browser" actions';
      const output1 = `<a href='${JIRA}ECOSCOM-3940' target='_blank' class='commits-grid__link'>ECOSCOM-3940</a> - category-document-type does not have "Delete" and "View in browser" actions`;
      expect(parseTasksLinks(input1)).toEqual(output1);

      const input2 = 'Merged into bugfix/ECOSUI-569-2 (pull-request #797)';
      const output2 = `Merged into bugfix/<a href='${JIRA}ECOSUI-569' target='_blank' class='commits-grid__link'>ECOSUI-569</a>-2 (pull-request #797)`;
      expect(parseTasksLinks(input2)).toEqual(output2);
    });
  });

  describe('<Loader />', () => {
    it('should render Loader component', () => {
      const { container } = render(<Loader />);
      expect(container).toMatchSnapshot();
    });
  });

  describe('<ErrorText />', () => {
    it('should render ErrorText component', () => {
      const { container } = render(<ErrorText />);
      expect(container).toMatchSnapshot();
    });
  });

  describe('<Tabs />', () => {
    let spy = null;

    const renderComponent = (contextValue = {}) => {
      spy = jest.spyOn(DevToolsContext, 'useContext').mockImplementation(() => ({ ...contextValue }));
      const wrapper = render(<Tabs />);
      const container = wrapper.container.getElementsByClassName('dev-tools-page__tabs');

      expect(container).toHaveLength(1);

      const wrapperContainer = container[0].children.item(0);
      return { ...wrapper, wrapper: wrapperContainer, children: wrapperContainer.children };
    };

    afterEach(() => {
      spy && spy.mockClear();
    });

    it('should render Tabs component', () => {
      const { container } = renderComponent();
      expect(container).toMatchSnapshot();
    });

    it('no active tab', () => {
      const { children, wrapper, asFragment } = renderComponent();

      for (let child of children) {
        expect(child.getElementsByClassName('ecos-tab_active')).toHaveLength(0);
      }
    });

    for (const tabIndex in TABS) {
      let index = 1;

      it(`check active tab`, () => {
        const { wrapper, children } = renderComponent({ activeTab: TABS.BUILD });
        const tab = children.item(0);
        expect(tab.classList.contains('ecos-tab_active')).toBeTruthy();
      });
    }

    it(`switch between tabs`, async () => {
      const setActiveTab = jest.fn();
      const user = userEvent.setup();
      const { children, wrapper } = renderComponent({ setActiveTab });
      const firstTab = children.item(0);
      const lastTab = children.item(children.length - 1);

      expect(setActiveTab).toHaveBeenCalledTimes(0);

      await user.click(lastTab);
      expect(setActiveTab).toHaveBeenCalledTimes(1);

      await user.click(firstTab);
      expect(setActiveTab).toHaveBeenCalledTimes(2);
    });
  });

  describe('<TabContent />', () => {
    const mockStore = configureStore();

    const renderComponent = (contextValue = {}) => {
      jest.spyOn(DevToolsContext, 'useContext').mockImplementation(() => ({ ...contextValue }));

      const { container } = render(
        <Provider store={mockStore(contextValue)}>
          <SettingsContextProvider>
            <CommitsContextProvider>
              <DevModulesContextProvider>
                <BuildContextProvider>
                  <TabContent />
                </BuildContextProvider>
              </DevModulesContextProvider>
            </CommitsContextProvider>
          </SettingsContextProvider>
        </Provider>
      );

      return container;
    };

    it('should render TabContent component', () => {
      const wrapper = renderComponent();
      expect(wrapper).toMatchSnapshot();
    });

    it('should render Build component by default', () => {
      renderComponent();
      expect(screen.getByText(BuildLabels.title)).toBeInTheDocument();
    });

    it('should render Build component', () => {
      const wrapper = renderComponent({ activeTab: TABS.BUILD });
      expect(screen.getByText(BuildLabels.title)).toBeInTheDocument();
      expect(wrapper).toMatchSnapshot();
    });

    it('should render DevModules component', () => {
      const wrapper = renderComponent({ activeTab: TABS.DEV_MODULES });
      expect(screen.getByText(DevModulesLabels.title)).toBeInTheDocument();
      expect(wrapper).toMatchSnapshot();
    });

    it('should render Commits component', () => {
      const wrapper = renderComponent({ activeTab: TABS.COMMITS });
      expect(wrapper).toMatchSnapshot();
    });

    it('should render Settings component', () => {
      const wrapper = renderComponent({ activeTab: TABS.SETTINGS });
      expect(wrapper.getElementsByClassName('dev-tools-page__setting')).toHaveLength(4);
      expect(wrapper).toMatchSnapshot();
    });
  });
});
