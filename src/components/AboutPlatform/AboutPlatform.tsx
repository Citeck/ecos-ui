import classNames from 'classnames';
import get from 'lodash/get';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

import Records from '@/components/Records';
import LogoIcon from '@/components/common/icons/global/Logo';
import { AppEditions, SourcesId } from '@/constants';
import { PLATFORM_COPYRIGHT, PLATFORM_LINK_COMMUNITY, PLATFORM_NAME } from '@/constants/platform';
import { t } from '@/helpers/util';
import { RootState } from '@/types/store';

import './AboutPlatform.scss';

export default function AboutPlatform() {
  const [systemVersion, setSystemVersion] = React.useState<string | null>(null);
  const appEdition: string = useSelector((state: RootState) => get(state, 'app.appEdition')) || '';

  useEffect(() => {
    Records.get(`${SourcesId.SYSTEM_REPO}@ecos-system-info`)
      .load('data.deploymentVersion', true)
      .then((version: string | null) => setSystemVersion(version));
  }, []);

  return (
    <div className="citeck-about-platform">
      <div className="citeck-about-platform__content">
        <LogoIcon />
        <div className="citeck-about-platform__content-info">
          <div className="citeck-about-platform__content-version">
            <h3 className="citeck-about-platform_head-text">{PLATFORM_NAME}</h3>
            <div className={classNames('citeck-about-platform__status', appEdition)}>
              {AppEditions[appEdition === AppEditions.ENTERPRISE ? 'ENTERPRISE' : 'COMMUNITY']}
            </div>
          </div>
          <div className="citeck-about-platform__content-version description">
            <span className="citeck-about-platform__content-version_text">{t('dochist.header.version')}</span>
            <span className="citeck-about-platform__content-version_text">{systemVersion}</span>
          </div>
        </div>
      </div>
      <div className="citeck-about-platform__description">
        <p className="citeck-about-platform__description_text">
          {t('platform.description.join-into-community')}
          <a target="_blank" href={PLATFORM_LINK_COMMUNITY} className="citeck-about-platform__description_text link" rel="noreferrer">
            {PLATFORM_NAME}
          </a>
        </p>
        <p className="citeck-about-platform__description_text">{t('platform.description.copyright', { copyright: PLATFORM_COPYRIGHT })}</p>
      </div>
    </div>
  );
}
