import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { connect, Provider } from 'react-redux';
import { applyMiddleware, combineReducers, createStore } from 'redux';

import ConnectedBarcodeDashlet, { BarcodeDashlet } from '../BarcodeDashlet';

import { getBarcodePrintPdf } from '@/actions/barcode';
import { setTabs } from '@/actions/pageTabs';
import { defaultPrintSettings } from '@/dto/barcodePrint';
import { getStateId } from '@/helpers/store';
import { t } from '@/helpers/util';
import pageTabsReducer from '@/reducers/pageTabs';
import { selectActiveTab } from '@/selectors/pageTabs';

jest.mock('../../BaseWidget', () => {
  const React = require('react');
  return class extends React.Component {
    state = {};
    componentDidMount() {}
    componentDidUpdate() {}
    componentWillUnmount() {}
  };
});
jest.mock('@/components/dashboard/Dashlet', () => ({ children }) => <section>{children}</section>);
jest.mock('react-custom-scrollbars', () => ({ Scrollbars: ({ children }) => <div>{children}</div> }));
jest.mock('../Settings', () => () => null);

const pdf = new Blob(['%PDF-1.7'], { type: 'application/pdf' });
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
const makeTab = () => {
  const tab = { closed: false, opener: window, document: document.implementation.createHTMLDocument(), location: { replace: jest.fn() } };
  tab.close = jest.fn(() => {
    tab.closed = true;
  });
  return tab;
};
const printButton = () => screen.getByRole('button', { name: t('barcode-widget.btn.print') });
const setup = (overrides = {}) => {
  const ref = React.createRef();
  const request = deferred();
  const props = {
    id: 'barcode',
    record: 'emodel/test@id',
    config: {},
    init: jest.fn(),
    generateBase64Barcode: jest.fn(),
    loadPrintPdf: jest.fn(() => request.promise),
    barcode: 'data:image/png;base64,preview',
    ...overrides
  };
  const view = render(<BarcodeDashlet {...props} ref={ref} />);
  return { ...view, ref, props, request, rerenderRecord: record => view.rerender(<BarcodeDashlet {...props} record={record} ref={ref} />) };
};

const setupCachedDashboard = () => {
  const widgetProps = { id: 'barcode', tabId: 'record-tab', record: 'emodel/test@id', config: {}, isActiveLayout: true };
  const requests = [];
  const capturePrintRequests = () => next => action => {
    if (action.type === getBarcodePrintPdf().type) requests.push(action.payload);
    return next(action);
  };
  const store = createStore(
    combineReducers({
      pageTabs: pageTabsReducer,
      barcode: (state = { [getStateId(widgetProps)]: { barcode: 'data:image/png;base64,preview' } }) => state
    }),
    applyMiddleware(capturePrintRequests)
  );
  const activeSubscriptions = new Set();
  const subscribe = store.subscribe;
  jest.spyOn(store, 'subscribe').mockImplementation(callback => {
    const unsubscribe = subscribe(callback);
    activeSubscriptions.add(callback);
    return () => {
      activeSubscriptions.delete(callback);
      unsubscribe();
    };
  });
  const activate = id => store.dispatch(setTabs(['record-tab', 'home-tab'].map(tabId => ({ id: tabId, isActive: tabId === id }))));
  activate('record-tab');
  const renderDashboard = jest.fn();
  class CachedDashboard extends React.Component {
    shouldComponentUpdate(nextProps) {
      // Like Dashboard: an inactive cached page blocks parent-driven widget props.
      return nextProps.activeTabId === widgetProps.tabId;
    }
    render() {
      renderDashboard();
      return <ConnectedBarcodeDashlet {...widgetProps} />;
    }
  }
  const ConnectedDashboard = connect(state => ({ activeTabId: selectActiveTab(state)?.id }))(CachedDashboard);
  const view = render(
    <Provider store={store}>
      <ConnectedDashboard />
    </Provider>
  );
  return { ...view, requests, activate, renderDashboard, activeSubscriptions };
};

describe('BarcodeDashlet PDF print lifecycle', () => {
  let tab;
  beforeEach(() => {
    jest.useFakeTimers();
    tab = makeTab();
    jest.spyOn(window, 'open').mockReturnValue(tab);
    URL.createObjectURL = jest.fn(() => 'blob:barcode-pdf');
    URL.revokeObjectURL = jest.fn();
  });
  afterEach(() => {
    tab.closed = true;
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('reserves an accessible tab synchronously, freezes duplicate clicks, and preserves PDF download after unmount', async () => {
    const { ref, props, request, unmount } = setup();
    let first, second;
    act(() => {
      first = ref.current.handlePrint();
      second = ref.current.handlePrint();
    });
    expect(window.open).toHaveBeenCalledWith('', '_blank');
    expect(props.loadPrintPdf).toHaveBeenCalledTimes(1);
    expect(tab.opener).toBeNull();
    expect(tab.document.querySelector('[role=status]').textContent).toBe(t('barcode-widget.print.loading'));
    expect(printButton()).toBeDisabled();
    expect(printButton()).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent(t('barcode-widget.print.loading'));
    expect(screen.getByRole('img')).toHaveAttribute('src', props.barcode);
    await act(async () => {
      request.resolve(pdf);
      await Promise.all([first, second]);
    });
    expect(tab.location.replace).toHaveBeenCalledWith('blob:barcode-pdf');
    expect(printButton()).toBeEnabled();
    unmount();
    jest.advanceTimersByTime(60000);
    expect(tab.close).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    tab.closed = true;
    jest.advanceTimersByTime(1000);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('does not request a PDF when popups are blocked and allows an explicit retry', async () => {
    const { props, request } = setup();
    window.open.mockReturnValueOnce(null);
    fireEvent.click(printButton());
    expect(props.loadPrintPdf).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(t('barcode-widget.print.error.popup'));
    expect(printButton()).toBeEnabled();
    fireEvent.click(printButton());
    await act(async () => {
      request.resolve(pdf);
    });
    expect(props.loadPrintPdf).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each([
    [400, 'fit'],
    [401, 'access'],
    [403, 'access'],
    [404, 'not-found'],
    [500, 'prepare'],
    [undefined, 'prepare']
  ])('handles status/network failure %s locally, closes the blank tab and permits retry', async (status, key) => {
    const { props, request } = setup();
    fireEvent.click(printButton());
    await act(async () => {
      request.reject(Object.assign(new Error('<html>secret</html>'), { status }));
    });
    expect(screen.getByRole('alert')).toHaveTextContent(t(`barcode-widget.print.error.${key}`));
    expect(screen.queryByText(/secret/)).not.toBeInTheDocument();
    expect(tab.close).toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(printButton()).toBeEnabled();
    expect(screen.getByRole('img')).toHaveAttribute('src', props.barcode);
    const nextTab = makeTab();
    window.open.mockReturnValueOnce(nextTab);
    props.loadPrintPdf.mockResolvedValueOnce(pdf);
    fireEvent.click(printButton());
    await act(async () => {});
    expect(nextTab.location.replace).toHaveBeenCalled();
    nextTab.closed = true;
    jest.advanceTimersByTime(1000);
  });

  it('cleans up and allows retry when the placeholder cannot be initialized', () => {
    const { props } = setup();
    jest.spyOn(tab.document.body, 'replaceChildren').mockImplementation(() => {
      throw new Error('placeholder failed');
    });
    fireEvent.click(printButton());
    expect(tab.close).toHaveBeenCalled();
    expect(props.loadPrintPdf).not.toHaveBeenCalled();
    expect(printButton()).toBeEnabled();
    expect(screen.getByRole('alert')).toHaveTextContent(t('barcode-widget.print.error.prepare'));
  });

  it('keeps an already opened PDF alive on record change', async () => {
    const { request, rerenderRecord } = setup();
    fireEvent.click(printButton());
    await act(async () => {
      request.resolve(pdf);
    });
    rerenderRecord('emodel/other@id');
    expect(tab.close).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it('does not reopen a tab the user closed while preparing the PDF', async () => {
    const { request } = setup();
    fireEvent.click(printButton());
    tab.closed = true;
    await act(async () => {
      request.resolve(pdf);
    });
    expect(window.open).toHaveBeenCalledTimes(1);
    expect(tab.location.replace).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(t('barcode-widget.print.error.closed'));
    expect(printButton()).toBeEnabled();
  });

  it.each([false, true])('retires a pending request on record change/unmount (unmount=%s)', async doUnmount => {
    const { request, props, unmount, rerenderRecord, ref } = setup();
    fireEvent.click(printButton());
    const signal = props.loadPrintPdf.mock.calls[0][0].signal;
    const instance = ref.current;
    if (doUnmount) unmount();
    else rerenderRecord('emodel/other@id');
    expect(signal.aborted).toBe(true);
    expect(tab.close).toHaveBeenCalled();
    const stateSpy = jest.spyOn(instance, 'setState');
    await act(async () => {
      request.resolve(pdf);
    });
    expect(stateSpy).not.toHaveBeenCalled();
    expect(tab.location.replace).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    if (!doUnmount) expect(printButton()).toBeEnabled();
  });

  it('an old rejection cannot clear a new record request or its guard', async () => {
    const { request, props, rerenderRecord, ref } = setup();
    fireEvent.click(printButton());
    rerenderRecord('emodel/other@id');
    const nextTab = makeTab();
    const nextRequest = deferred();
    window.open.mockReturnValueOnce(nextTab);
    props.loadPrintPdf.mockReturnValueOnce(nextRequest.promise);
    fireEvent.click(printButton());
    await act(async () => {
      request.reject(new Error('old error'));
    });
    expect(printButton()).toBeDisabled();
    act(() => {
      ref.current.handlePrint();
    });
    expect(props.loadPrintPdf).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await act(async () => {
      nextRequest.resolve(pdf);
    });
    expect(nextTab.location.replace).toHaveBeenCalled();
    nextTab.closed = true;
    jest.advanceTimersByTime(1000);
  });

  it('releases a Blob URL and closes the tab if navigation fails', async () => {
    const { request } = setup();
    tab.location.replace.mockImplementation(() => {
      throw new Error('navigation failed');
    });
    fireEvent.click(printButton());
    await act(async () => {
      request.resolve(pdf);
    });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:barcode-pdf');
    expect(tab.close).toHaveBeenCalled();
    expect(printButton()).toBeEnabled();
  });

  it.each([{ version: 2 }, { pageFormat: 'Letter' }, { scalePercent: 0 }, { offsetTopMm: 297 }])(
    'validates settings before reserving a tab: %s',
    printSettings => {
      const { props } = setup({ config: { printSettings } });
      fireEvent.click(printButton());
      expect(window.open).not.toHaveBeenCalled();
      expect(props.loadPrintPdf).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toHaveTextContent(t('barcode-widget.print.error.settings'));
    }
  );

  it('preserves the legacy path regardless of modern configuration', () => {
    const { props } = setup({ record: 'alfresco/@workspace://SpacesStore/id', config: { printSettings: { version: 9 } } });
    fireEvent.click(printButton());
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining(
        'citeck/print/barcode?nodeRef=alfresco/@workspace://SpacesStore/id&barcodeType=code-128&scale=5&margins=20,200,20,50&print=true'
      ),
      '_blank'
    );
    expect(props.loadPrintPdf).not.toHaveBeenCalled();
  });

  it('retires a pending PDF when a cached page becomes inactive without new widget props, then allows retry', async () => {
    const { requests, activate, renderDashboard } = setupCachedDashboard();
    fireEvent.click(printButton());
    act(() => {
      activate('record-tab');
    });
    expect(requests[0].signal.aborted).toBe(false);
    expect(tab.close).not.toHaveBeenCalled();
    const renderCount = renderDashboard.mock.calls.length;
    act(() => {
      activate('home-tab');
    });
    expect(renderDashboard).toHaveBeenCalledTimes(renderCount);
    expect(requests[0].record).toBe('emodel/test@id');
    expect(requests[0].signal.aborted).toBe(true);
    expect(tab.close).toHaveBeenCalledTimes(1);
    expect(printButton()).toBeEnabled();
    fireEvent.click(printButton());
    expect(requests).toHaveLength(1);
    await act(async () => {
      requests[0].onSuccess(pdf);
    });
    expect(tab.location.replace).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();

    act(() => {
      activate('record-tab');
    });
    const nextTab = makeTab();
    window.open.mockReturnValueOnce(nextTab);
    fireEvent.click(printButton());
    expect(requests).toHaveLength(2);
    await act(async () => {
      requests[1].onSuccess(pdf);
    });
    expect(nextTab.location.replace).toHaveBeenCalledWith('blob:barcode-pdf');
    nextTab.closed = true;
    jest.advanceTimersByTime(1000);
  });

  it('an inactive cached page late rejection cannot affect a new print after returning', async () => {
    const { requests, activate } = setupCachedDashboard();
    fireEvent.click(printButton());
    act(() => {
      activate('home-tab');
    });
    act(() => {
      activate('record-tab');
    });
    const nextTab = makeTab();
    window.open.mockReturnValueOnce(nextTab);
    fireEvent.click(printButton());
    expect(requests).toHaveLength(2);
    await act(async () => {
      requests[0].onError(new Error('old request'));
    });
    expect(printButton()).toBeDisabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await act(async () => {
      requests[1].onSuccess(pdf);
    });
    expect(nextTab.location.replace).toHaveBeenCalledWith('blob:barcode-pdf');
    nextTab.closed = true;
    jest.advanceTimersByTime(1000);
  });

  it('preserves a successfully opened PDF when its cached page becomes inactive', async () => {
    const { requests, activate, unmount } = setupCachedDashboard();
    fireEvent.click(printButton());
    await act(async () => {
      requests[0].onSuccess(pdf);
    });
    act(() => {
      activate('home-tab');
    });
    unmount();
    expect(tab.close).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    tab.closed = true;
    jest.advanceTimersByTime(1000);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it('cleans up the connected page-activity subscription and pending print on actual unmount', async () => {
    const { requests, activate, activeSubscriptions, unmount } = setupCachedDashboard();
    expect(activeSubscriptions.size).toBeGreaterThan(0);
    fireEvent.click(printButton());
    unmount();
    expect(activeSubscriptions.size).toBe(0);
    expect(requests[0].signal.aborted).toBe(true);
    act(() => {
      activate('home-tab');
    });
    await act(async () => {
      requests[0].onSuccess(pdf);
    });
    expect(tab.location.replace).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('modern save preserves legacy settings, unrelated config and existing display conditions', () => {
    const config = {
      settings: { scale: 500, right: 200, bottom: 50 },
      other: { keep: true },
      elementsDisplayCondition: { anotherAction: 'unchanged', btnGenerateNew: 'old' }
    };
    const onSave = jest.fn();
    const { ref } = setup({ config, onSave });
    act(() => {
      ref.current.handleSaveSettings(defaultPrintSettings, { btnGenerateNew: 'new' });
    });
    expect(onSave).toHaveBeenCalledWith('barcode', {
      config: {
        ...config,
        printSettings: defaultPrintSettings,
        elementsDisplayCondition: { anotherAction: 'unchanged', btnGenerateNew: 'new' }
      }
    });
    expect(config).not.toHaveProperty('printSettings');
  });
});
