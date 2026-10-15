import { DashboardTypes } from '@citeck/constants/dashboard';

import ConnectedOrgstructure from '../Orgstructure';

// The orgstructure page shows the dashboard of the picked person, and a dashboard of its own
// (`orgstructure-dashboard`) while nobody is picked. Both arrive through the same store slot, so
// right after the pick changes the slot still holds the dashboard of the other state: it must not be
// rendered — a person's widgets have no record to show without a person.
describe('Orgstructure page', () => {
  const Orgstructure = ConnectedOrgstructure.WrappedComponent;
  const person = 'emodel/person@ivan';

  const layout = id => ({ id, tab: { label: id, idLayout: id }, type: '1-column', columns: [{ widgets: [] }] });

  const personDashboard = {
    identificationId: 'orgstructure-person-dashboard',
    dashboardType: DashboardTypes.PROFILE,
    config: [layout('person-info'), layout('person-documents')]
  };

  const orgstructureDashboard = {
    identificationId: 'orgstructure-dashboard',
    dashboardType: DashboardTypes.ORGSTRUCTURE_HOME,
    config: [layout('orgstructure-main')]
  };

  const createPage = (props = {}, state = {}) => {
    const instance = new Orgstructure({
      tabId: 'orgstructure-tab',
      isMobile: false,
      recordRef: '',
      config: [],
      getDashboardConfig: jest.fn(),
      getDashboardTitle: jest.fn(),
      setLoading: jest.fn(),
      onSelectPerson: jest.fn(),
      saveDashboardConfig: jest.fn(),
      ...props
    });

    Object.assign(instance.state, { activeTab: 0 }, state);

    instance.setState = jest.fn((update, callback) => {
      Object.assign(instance.state, typeof update === 'function' ? update(instance.state) : update);
      callback && callback();
    });

    return instance;
  };

  const isEmptyText = element => element.props.className === 'orgstructure-page__grid-empty-widgets';
  const findLayout = element => element.props.children.find(child => child && child.props && 'onSaveWidgetProps' in child.props);

  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  describe('loading', () => {
    it('loads the page dashboard when nobody is picked', () => {
      window.history.replaceState({}, '', '/v2/orgstructure');
      const page = createPage();

      page.componentDidMount();

      expect(page.props.getDashboardConfig).toHaveBeenCalledWith({ recordRef: '' });
      expect(page.props.onSelectPerson).not.toHaveBeenCalled();
    });

    it('loads the dashboard of the person named by the address', () => {
      window.history.replaceState({}, '', `/v2/orgstructure?recordRef=${person}`);
      const page = createPage();

      page.componentDidMount();

      expect(page.props.getDashboardConfig).toHaveBeenCalledWith({ recordRef: person });
      expect(page.props.getDashboardConfig).not.toHaveBeenCalledWith({ recordRef: '' });
      expect(page.props.onSelectPerson).toHaveBeenCalledWith(person);
    });

    it('goes back to the page dashboard, on its first tab, once the pick is cleared', () => {
      window.history.replaceState({}, '', '/v2/orgstructure');
      const page = createPage({ recordRef: person, ...personDashboard }, { activeTab: 1 });

      page.componentDidUpdate({}, {});

      expect(page.props.onSelectPerson).toHaveBeenCalledWith('');
      expect(page.props.getDashboardConfig).toHaveBeenCalledWith({ recordRef: '' });
      expect(page.state.activeTab).toBe(0);
    });

    it('keeps the pick while the tab renders under the address of the page it is left for', () => {
      window.history.replaceState({}, '', '/v2/journals?journalId=bpmn-active-tasks');
      const page = createPage({ recordRef: person, ...personDashboard }, { activeTab: 1 });

      page.componentDidUpdate({}, {});

      expect(page.props.onSelectPerson).not.toHaveBeenCalled();
      expect(page.props.getDashboardConfig).not.toHaveBeenCalled();
      expect(page.state.activeTab).toBe(1);
    });
  });

  describe('rendering', () => {
    it('shows the page dashboard while nobody is picked', () => {
      const element = createPage({ ...orgstructureDashboard }).renderDashboard();

      expect(isEmptyText(element)).toBe(false);
      expect(findLayout(element).props.dashboardId).toBe('orgstructure-dashboard');
    });

    it("does not show a person's dashboard once the pick is cleared, until the page dashboard arrives", () => {
      expect(isEmptyText(createPage({ ...personDashboard }).renderDashboard())).toBe(true);
    });

    it('does not show the page dashboard once a person is picked, until their dashboard arrives', () => {
      expect(isEmptyText(createPage({ recordRef: person, ...orgstructureDashboard }).renderDashboard())).toBe(true);
    });

    it("shows the picked person's dashboard", () => {
      const element = createPage({ recordRef: person, ...personDashboard }).renderDashboard();

      expect(isEmptyText(element)).toBe(false);
      expect(findLayout(element).props.dashboardId).toBe('orgstructure-person-dashboard');
    });

    it('shows the text when no dashboard has been loaded', () => {
      expect(isEmptyText(createPage().renderDashboard())).toBe(true);
    });

    it('shows the tabs only when there is more than one to switch to', () => {
      const tabsOf = element => element.props.children[0];

      expect(tabsOf(createPage({ ...orgstructureDashboard }).renderDashboard())).toBeNull();
      expect(tabsOf(createPage({ recordRef: person, ...personDashboard }).renderDashboard())).not.toBeNull();
    });
  });

  describe('on a phone', () => {
    const [tree, dashboard] = [0, 1];
    const parts = page => page.render().props.children;

    it('shows only the tree while nobody is picked, even with the page dashboard loaded', () => {
      const children = parts(createPage({ isMobile: true, ...orgstructureDashboard }));

      expect(children[tree]).toBeTruthy();
      expect(children[dashboard]).toBeFalsy();
    });

    it("keeps the tree until the picked person's dashboard arrives", () => {
      const children = parts(createPage({ isMobile: true, recordRef: person, ...orgstructureDashboard }));

      expect(children[tree]).toBeTruthy();
      expect(children[dashboard]).toBeFalsy();
    });

    it("shows the picked person's dashboard instead of the tree", () => {
      const children = parts(createPage({ isMobile: true, recordRef: person, ...personDashboard }));

      expect(children[tree]).toBeFalsy();
      expect(children[dashboard]).toBeTruthy();
    });
  });

  describe('saving a widget', () => {
    it('saves the changed props of a widget into the dashboard it belongs to', () => {
      const originalConfig = {
        version: 'v2',
        v2: {
          widgets: [{ id: 'html-widget', name: 'html', props: { id: 'html-widget', config: { htmlString: { ru: 'old' } } } }],
          desktop: [],
          mobile: []
        }
      };
      const page = createPage({ ...orgstructureDashboard, originalConfig, configVersion: 'v2' });
      const callback = jest.fn();

      page.handleSaveWidgetProps('html-widget', { config: { htmlString: { ru: 'new' } } }, callback);

      expect(page.props.saveDashboardConfig).toHaveBeenCalledTimes(1);

      const [{ config, recordRef, callback: passedCallback }] = page.props.saveDashboardConfig.mock.calls[0];

      expect(config.v2.widgets[0].props).toEqual({ id: 'html-widget', config: { htmlString: { ru: 'new' } } });
      expect(originalConfig.v2.widgets[0].props.config.htmlString.ru).toBe('old');
      expect(recordRef).toBe('');
      expect(passedCallback).toBe(callback);
    });

    it('saves a widget moved inside a layout of an old-format dashboard', () => {
      const first = { id: 'first', name: 'html', props: { id: 'first' } };
      const second = { id: 'second', name: 'html', props: { id: 'second' } };
      const config = [{ ...layout('orgstructure-main'), columns: [{ widgets: [first, second] }] }];
      const page = createPage({ ...orgstructureDashboard, config });

      page.prepareWidgetsConfig(
        { isWidget: true, columnFrom: 0, columnTo: 0, positionFrom: 0, positionTo: 1 },
        { source: { droppableId: '0', index: 0 }, destination: { droppableId: '0', index: 1 } }
      );

      const [{ config: saved }] = page.props.saveDashboardConfig.mock.calls[0];

      expect(saved[0].columns[0].widgets.map(widget => widget.id)).toEqual(['second', 'first']);
    });
  });
});
