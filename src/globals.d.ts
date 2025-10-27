/// <reference types="vite/client" />
import { Base64 } from 'js-base64';
import { compose } from 'redux';

import { RecordsContainerType } from '@/components/Records/Records';
import { NotificationManager } from '@/services/notifications';

export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      REACT_APP_KEYCLOAK_CONFIG_CLIENT_ID?: string;
      REACT_APP_KEYCLOAK_CONFIG_REALM_ID?: string;
      REACT_APP_KEYCLOAK_CONFIG_EIS_ID?: string;
      RELEASE_VERSION?: string;
      PORT?: number;

      NODE_ENV: 'development' | 'production' | 'dev-stage';
      SHARE_PROXY_URL: string;
      PUBLIC_URL: string;
    }
  }

  interface Window {
    Records: RecordsContainerType;
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: <Opts>(opts?: Opts) => typeof compose;

    Citeck?: {
      Plugins?: any;
      NotificationManager?: typeof NotificationManager;
      Base64?: typeof Base64;
      Records?: RecordsContainerType;
      [key: string]: any;
    };

    ECOS_UI_BUILD_INFO: {
      time: string;
      version: string;
    };
  }
}
