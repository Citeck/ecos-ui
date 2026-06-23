/*
 * MUST be the first import: configures @citeck/records-core (http/i18n/workspace)
 * as a side-effect during module evaluation, before the rest of the app graph is
 * pulled in. See services/records/recordsBootstrap.ts.
 */
import './services/records/recordsBootstrap';

import 'regenerator-runtime/runtime';
import 'moment/dist/locale/ru';
import 'moment/dist/locale/en-gb';
import 'flatpickr/dist/l10n/ru.js';
import { allowedModes } from '@citeck/constants';
import { ConnectedRouter } from 'connected-react-router';
import datePickerLocaleEn from 'date-fns/locale/en-GB';
import datePickerLocaleRu from 'date-fns/locale/ru';
import { History } from 'history';
import { Base64 } from 'js-base64';
import moment from 'moment';
import { StrictMode } from 'react';
import { registerLocale, setDefaultLocale } from 'react-datepicker';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import { initAppRequest } from './actions/app';
import { setIsAuthenticated } from './actions/user';
import { loadThemeRequest } from './actions/view';
import { configureAPI } from './api';
import { RESET_AUTH_STATE_EVENT, emitter } from './helpers/ecosFetch';
import { registerGlobalConstants } from './helpers/registerGlobalConstants';
import { getCurrentLocale, IS_TEST_ENV, isMobileAppWebView, isMobileDevice } from './helpers/util';
import { i18nInit } from './i18n';
import plugins from './plugins';
import { register as registerServiceWorker } from './serviceWorkerRegistration';
import authService from './services/auth';
import configureStore, { getHistory } from './store';

import IdleTimer from '@/components/common/IdleTimer';
import { registerAllActions } from '@/components/core/Records/actions/actions';
import App from '@/components/layout/App';
import PageLoader from '@/components/layout/PageLoader';
import { NotificationManager } from '@/services/notifications';

// Files are included in the build only if imported from here
import '@/components/editors/ModelViewer/BPMNViewer/patches/features/modeling/ElementFactory.js';
import '@/components/editors/ModelViewer/BPMNViewer/patches/features/keyboard/BpmnKeyboardBindings.js';

import '@/components/editors/ModelEditor/BPMNModeler/modules/colorContextPadProvider/ColorContextPadProvider';
import '@/components/editors/ModelEditor/BPMNModeler/patches/features/modeling/ElementFactory';
import '@/components/editors/ModelEditor/BPMNModeler/patches/features/modeling/Modeling';
import '@/components/editors/ModelEditor/BPMNModeler/patches/features/modeling/cmd/UpdatePropertiesHandler';
import '@/components/editors/ModelEditor/BPMNModeler/patches/features/palette/PaletteProvider';
import '@/components/editors/ModelEditor/BPMNModeler/patches/features/popup-menu/ReplaceMenuProvider';
import '@/components/editors/ModelEditor/BPMNModeler/patches/features/context-pad/ContextPadProvider';
import '@/components/editors/ModelEditor/BPMNModeler/patches/features/keyboard/BpmnKeyboardBindings';
import '@/components/editors/ModelEditor/BPMNModeler/patches/features/label-editing/LabelEditingProvider';
import '@/components/editors/ModelEditor/BPMNModeler/patches/features/command/CommandStack';
import '@/components/editors/ModelEditor/BPMNModeler/patches/features/selection/Selection';

import '@/components/editors/ModelEditor/DMNModeler/patches/features/modeling/cmd/UpdatePropertiesHandler';
import '@/components/editors/ModelEditor/DMNModeler/patches/features/modeling/Modeling';
import '@/components/editors/ModelEditor/DMNModeler/patches/Viewer';

import '@/forms/Formio';
import '@/forms/components';
import '@/forms/components/Validator';
import '@/forms/Webform';
import '@/forms/WebformBuilder';
import '@/forms/Component';

import './helpers/polyfills';
import './build-info';
import './services/esign';
import './services/EcosModules';

import './styles/index.scss';

/* @citeck/records-core is configured via the first-import side-effect above */

/* expose core constants on window.Citeck.constants for legacy consumers */
registerGlobalConstants();

/* set moment locale */
const currentLocale = getCurrentLocale();
moment.locale(currentLocale);

/* set DatePicker locale */
registerLocale('en', datePickerLocaleEn);
registerLocale('ru', datePickerLocaleRu);
setDefaultLocale(currentLocale);

const { api, setNotAuthCallback } = configureAPI();
export const store = configureStore({ api });
const history: History = getHistory();
const setAuthStatus = (status?: boolean) => {
  if (!status) {
    store.dispatch(setIsAuthenticated(false));
  }
};

setNotAuthCallback(setAuthStatus);

emitter.on(RESET_AUTH_STATE_EVENT, setAuthStatus);

if (typeof window !== 'undefined') {
  if (!window.Citeck) {
    window.Citeck = {};
  }

  window.Citeck.Plugins = plugins;
  window.Citeck.NotificationManager = NotificationManager;
  window.Citeck.Base64 = Base64;
}

const root = createRoot(document.getElementById('root') as HTMLElement);
i18nInit({ debug: allowedModes.includes(process.env.NODE_ENV) }).then(() => {
  root.render(<PageLoader withoutSidebar={isMobileDevice()} />);
});

const runApp = () => {
  store.dispatch(
    initAppRequest({
      onRender: (isAuthenticated: boolean) => {
        if (isAuthenticated && allowedModes.includes(process.env.NODE_ENV)) {
          emitter.emit(RESET_AUTH_STATE_EVENT, true);
        }

        store.dispatch(
          loadThemeRequest({
            isAuthenticated,
            onRender: () => {
              root.render(
                <Provider store={store}>
                  <ConnectedRouter history={history}>
                    <StrictMode>
                      <App />
                    </StrictMode>
                  </ConnectedRouter>
                </Provider>
              );
            }
          })
        );
      }
    })
  );
};

if (!IS_TEST_ENV) {
  registerAllActions();
}

if (allowedModes.includes(process.env.NODE_ENV) && !isMobileAppWebView()) {
  authService.init().then(runApp);
  api.app.setCustomLogoutAction(() => authService.logout());
} else {
  runApp();
}

const idleTimer = new IdleTimer();
idleTimer
  .setCallbackRepeatTime(30 * 1000) // 30s
  .setIdleTimeout(60 * 60 * 1000) // 1h
  .setCallback((idle: typeof IdleTimer) => {
    if (!idle) {
      api.app.touch().catch(() => {});
    }
  })
  .run();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
registerServiceWorker();
