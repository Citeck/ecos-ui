import React from 'react';
import { shallow } from 'enzyme';

import DevToolsConverter from '../../../dto/devTools';

import { TABS } from '../constants';
import { JIRA } from '../Commits/constants';
import { getRepoProject, parseTasksLinks } from '../Commits/helpers';
import { input1, output1, input2, output2, input3_4, output3, output4 } from '../__mocks__/DevTools.mock';
import * as DevToolsContext from '../DevToolsContext';
import ErrorText from '../ErrorText';
import Loader from '../Loader';
import Tabs from '../Tabs';
import TabContent from '../TabContent';
import Build from '../Build';
import DevModules from '../DevModules';
import Commits from '../Commits';
import Settings from '../Settings';

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
      const component = shallow(<Loader />);
      expect(component).toMatchSnapshot();
    });
  });

  describe('<ErrorText />', () => {
    it('should render ErrorText component', () => {
      const component = shallow(<ErrorText />);
      expect(component).toMatchSnapshot();
    });
  });

  describe('<Tabs />', () => {
    let spy = null;
    const renderComponent = (contextValue = {}) => {
      spy = jest.spyOn(DevToolsContext, 'useContext').mockImplementation(() => ({ ...contextValue }));
      const wrapper = shallow(<Tabs />);
      const container = wrapper.find('.dev-tools-page__tabs').at(0);
      const containerProps = container.props();
      const children = containerProps.children;
      return { wrapper, children };
    };

    afterEach(() => {
      spy && spy.mockClear();
    });

    it('should render Tabs component', () => {
      const { wrapper } = renderComponent();
      expect(wrapper).toMatchSnapshot();
    });

    it('no active tab', () => {
      const { children } = renderComponent();
      const tabsItems = children.props.items;
      expect(tabsItems.find(item => item.isActive)).toBeUndefined();
    });

    for (const tabIndex in TABS) {
      it(`check active "${tabIndex}" tab`, () => {
        const { children } = renderComponent({ activeTab: TABS[tabIndex] });
        const tabsItems = children.props.items;
        const activeTab = tabsItems.find(item => item.isActive);
        expect(activeTab.id).toBe(TABS[tabIndex]);
      });
    }

    it(`switch between tabs`, () => {
      const setActiveTab = jest.fn();
      const { children } = renderComponent({ setActiveTab });
      const tabsItems = children.props.items;
      const firstTab = tabsItems[0];
      const lastTab = tabsItems[tabsItems.length - 1];

      expect(setActiveTab).toHaveBeenCalledTimes(0);

      lastTab.onClick();
      expect(setActiveTab).toHaveBeenCalled();
      expect(setActiveTab).toHaveBeenCalledWith(lastTab.id);

      firstTab.onClick();
      expect(setActiveTab).toHaveBeenCalledTimes(2);
      expect(setActiveTab).toHaveBeenNthCalledWith(2, firstTab.id);
    });
  });

  describe('<TabContent />', () => {
    let spy = null;
    const renderComponent = (contextValue = {}) => {
      spy = jest.spyOn(DevToolsContext, 'useContext').mockImplementation(() => ({ ...contextValue }));
      return shallow(<TabContent />);
    };

    afterEach(() => {
      spy && spy.mockClear();
    });

    it('should render TabContent component', () => {
      const wrapper = renderComponent();
      expect(wrapper).toMatchSnapshot();
    });

    it('should render Build component by default', () => {
      const wrapper = renderComponent();
      expect(wrapper.find(Build)).toHaveLength(1);
    });

    it('should render Build component', () => {
      const wrapper = renderComponent({ activeTab: TABS.BUILD });
      expect(wrapper.find(Build)).toHaveLength(1);
    });

    it('should render DevModules component', () => {
      const wrapper = renderComponent({ activeTab: TABS.DEV_MODULES });
      expect(wrapper.find(DevModules)).toHaveLength(1);
    });

    it('should render Commits component', () => {
      const wrapper = renderComponent({ activeTab: TABS.COMMITS });
      expect(wrapper.find(Commits)).toHaveLength(1);
    });

    it('should render Settings component', () => {
      const wrapper = renderComponent({ activeTab: TABS.SETTINGS });
      expect(wrapper.find(Settings)).toHaveLength(1);
    });
  });
});
