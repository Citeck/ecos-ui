import { act, fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router';

// Capture the props KaotoModeler receives (viewMode, visualEditingEnabled) without rendering Kaoto.
// `mountCount` tracks how many times the stub mounts — a remount (changed key) would bump it.
const kaotoCalls = [];
let mountCount = 0;
jest.mock('@/components/editors/ModelEditor/KaotoModeler', () => {
  const ReactLib = require('react');
  return {
    __esModule: true,
    default: jest.fn(props => {
      kaotoCalls.push(props);
      ReactLib.useEffect(() => {
        mountCount += 1;
      }, []);
      return ReactLib.createElement('div', { 'data-testid': 'kaoto-modeler-stub' });
    })
  };
});

// Records: edit-mode load returns a YAML content so KaotoModeler renders.
jest.mock('@citeck/records-core', () => ({
  __esModule: true,
  default: { get: jest.fn() }
}));

// ConfigService.getValue resolves the flag value the test sets per-case.
jest.mock('@/services/config/ConfigService', () => ({
  __esModule: true,
  default: { getValue: jest.fn() },
  CAMEL_VISUAL_EDITING_ENABLED: 'app/integrations$camel-visual-editing-enabled'
}));

// changeUrl is the app URL-change pipeline (updates router URL + stored PageTab.link + ws).
// Spy on it instead of letting the real helper dispatch document events / open windows in jsdom.
jest.mock('@/helpers/urls', () => ({
  __esModule: true,
  changeUrl: jest.fn()
}));

// CamelDslEditor calls PageService.rekeyWhereLinkOpen on each self-rewrite of its URL. Its logic is
// unit-tested in pageService.test.js; here we stub it so it doesn't reach into the mocked urls helpers
// (decodeLink/getWorkspaceId), which this suite intentionally replaces.
jest.mock('@/services/PageService', () => {
  const actual = jest.requireActual('@/services/PageService');
  actual.default.rekeyWhereLinkOpen = jest.fn();
  return actual;
});

import CamelDslEditor from '../CamelDslEditor';

import KaotoModeler from '@/components/editors/ModelEditor/KaotoModeler';
import Records from '@citeck/records-core';
import { changeUrl } from '@/helpers/urls';
import ConfigService, { CAMEL_VISUAL_EDITING_ENABLED } from '@/services/config/ConfigService';

const RECORD_REF = 'integrations/camel-dsl@test-route';
const SAMPLE_YAML = '- from:\n    uri: timer:tick\n    steps:\n      - log: hi\n';

const lastKaotoProps = () => kaotoCalls[kaotoCalls.length - 1];

const renderEditor = () => {
  // CamelDslEditor reads window.location.href (not router location) for its initial query.
  window.history.pushState({}, '', '?recordRef=' + encodeURIComponent(RECORD_REF));
  return render(
    <MemoryRouter>
      <CamelDslEditor />
    </MemoryRouter>
  );
};

describe('CamelDslEditor — camel-visual-editing-enabled flag', () => {
  beforeEach(() => {
    kaotoCalls.length = 0;
    mountCount = 0;
    KaotoModeler.mockClear();
    Records.get.mockReset();
    Records.get.mockReturnValue({
      load: jest.fn().mockResolvedValue({ content: SAMPLE_YAML, state: 'STOPPED', name: 'test-route' })
    });
    ConfigService.getValue.mockReset();
    changeUrl.mockReset();
  });

  it('flag OFF → default viewMode is "split" and KaotoModeler gets visualEditingEnabled={false}', async () => {
    ConfigService.getValue.mockResolvedValue(false);

    await act(async () => {
      renderEditor();
    });

    await waitFor(() => expect(lastKaotoProps()).toBeTruthy());

    expect(ConfigService.getValue).toHaveBeenCalledWith(CAMEL_VISUAL_EDITING_ENABLED);
    const props = lastKaotoProps();
    expect(props.visualEditingEnabled).toBe(false);
    expect(props.viewMode).toBe('split');
  });

  it('flag ON → default viewMode flips to "visual" and KaotoModeler gets visualEditingEnabled={true}', async () => {
    ConfigService.getValue.mockResolvedValue(true);

    await act(async () => {
      renderEditor();
    });

    await waitFor(() => expect(lastKaotoProps()?.visualEditingEnabled).toBe(true));

    const props = lastKaotoProps();
    expect(props.visualEditingEnabled).toBe(true);
    expect(props.viewMode).toBe('visual');
  });

  it('flag resolve flips viewMode without remounting the canvas (stable kaotoKey)', async () => {
    // Hold the flag promise pending so the record loads first (split/false), then resolve ON.
    let resolveFlag;
    ConfigService.getValue.mockReturnValue(new Promise(r => (resolveFlag = r)));

    await act(async () => {
      renderEditor();
    });

    // Record loaded, flag still pending → safe start: split + visualEditingEnabled false.
    await waitFor(() => expect(lastKaotoProps()).toBeTruthy());
    expect(lastKaotoProps().viewMode).toBe('split');
    expect(lastKaotoProps().visualEditingEnabled).toBe(false);
    expect(mountCount).toBe(1);

    // Resolve flag ON → viewMode flips to 'visual', but kaotoKey (recordRef) is unchanged.
    await act(async () => {
      resolveFlag(true);
    });
    await waitFor(() => expect(lastKaotoProps()?.viewMode).toBe('visual'));

    expect(lastKaotoProps().visualEditingEnabled).toBe(true);
    // No remount despite the viewMode/flag flip — kaotoKey does not depend on either.
    expect(mountCount).toBe(1);
  });

  it('explicit view-mode pick is NOT overridden when the flag later resolves ON', async () => {
    // Hold the flag pending so the user can pick a mode before it resolves.
    let resolveFlag;
    ConfigService.getValue.mockReturnValue(new Promise(r => (resolveFlag = r)));

    let utils;
    await act(async () => {
      utils = renderEditor();
    });

    await waitFor(() => expect(lastKaotoProps()).toBeTruthy());
    expect(lastKaotoProps().viewMode).toBe('split');

    // User explicitly switches to 'yaml' while the flag is still pending.
    // t() возвращает ключ в тест-окружении (i18next не инициализирован) — режим-кнопка по ключу.
    await act(async () => {
      fireEvent.click(utils.getByText('camel-dsl-editor.mode.yaml'));
    });
    await waitFor(() => expect(lastKaotoProps().viewMode).toBe('yaml'));

    // Flag resolves ON afterwards — must NOT stomp the user's explicit 'yaml' pick back to 'visual'.
    await act(async () => {
      resolveFlag(true);
    });
    await waitFor(() => expect(lastKaotoProps().visualEditingEnabled).toBe(true));
    expect(lastKaotoProps().viewMode).toBe('yaml');
  });
});

describe('CamelDslEditor — URL / tab-link updates go through changeUrl({ updateUrl })', () => {
  beforeEach(() => {
    kaotoCalls.length = 0;
    mountCount = 0;
    KaotoModeler.mockClear();
    Records.get.mockReset();
    ConfigService.getValue.mockReset();
    ConfigService.getValue.mockResolvedValue(false);
    changeUrl.mockReset();
  });

  const renderAt = search => {
    window.history.pushState({}, '', '/v2/camel-dsl-editor' + search);
    return render(
      <MemoryRouter>
        <CamelDslEditor />
      </MemoryRouter>
    );
  };

  it('new-mode without draftId → pins a draftId via changeUrl(updateUrl), preserving ws and new=true', async () => {
    await act(async () => {
      renderAt('?new=true&ws=ws-alpha');
    });

    await waitFor(() => expect(changeUrl).toHaveBeenCalled());

    const [link, opts] = changeUrl.mock.calls[0];
    // skipUrlChangeGuards: this is a same-tab metadata rewrite, not navigation away — it must bypass
    // other cached editors' beforeUrlChangeGuards (no spurious workspace-change confirm / cancel).
    expect(opts).toEqual({ updateUrl: true, skipUrlChangeGuards: true });
    const { query } = require('query-string').parseUrl(link);
    // ws preserved (finding 1), new kept, draftId injected so the tab-key is unique (finding 2).
    expect(query.ws).toBe('ws-alpha');
    expect(query.new).toBe('true');
    expect(typeof query.draftId).toBe('string');
    expect(query.draftId.length).toBeGreaterThan(0);
  });

  it('does NOT rewrite the URL when a draftId is already present', async () => {
    await act(async () => {
      renderAt('?new=true&draftId=draft-123&ws=ws-alpha');
    });

    // Give the mount effect a tick; it must early-return (draftId already pinned).
    await act(async () => {});
    expect(changeUrl).not.toHaveBeenCalled();
  });

  it('save in new-mode → switches URL to recordRef via changeUrl(updateUrl), dropping new/draftId but keeping ws', async () => {
    const NEW_ID = 'integrations/camel-dsl@created-id';
    const savedRecord = { id: NEW_ID };
    // new-mode creates via Records.get('integrations/camel-dsl@'); after save, setRecordRef(NEW_ID)
    // triggers the edit-mode load effect, so the same stub also answers .load().
    const draft = {
      att: jest.fn(),
      save: jest.fn().mockResolvedValue(savedRecord),
      load: jest.fn().mockResolvedValue({ content: '- from: {}', state: 'STOPPED', name: 'created' })
    };
    Records.get.mockReturnValue(draft);

    let utils;
    await act(async () => {
      utils = renderAt('?new=true&draftId=draft-xyz&ws=ws-alpha');
    });

    // Mount effect must not rewrite (draftId already present) — isolate the save call below.
    await act(async () => {});
    changeUrl.mockClear();

    // Pick a trigger so yaml !== null and Save is enabled.
    await act(async () => {
      fireEvent.change(utils.getByRole('combobox'), { target: { value: 'ecos-event-record-created' } });
    });
    await waitFor(() => expect(lastKaotoProps()).toBeTruthy());

    await act(async () => {
      // Save lives in the top header panel (visible in every view mode), not the ModelEditorWrapper
      // floating toolbar — we no longer pass onApply, so there is no `bpmn-save-btn-*`.
      fireEvent.click(utils.container.querySelector('.camel-dsl-editor__save-btn'));
    });

    await waitFor(() => expect(changeUrl).toHaveBeenCalled());
    const [link, opts] = changeUrl.mock.calls[0];
    expect(opts).toEqual({ updateUrl: true, skipUrlChangeGuards: true });
    const { query } = require('query-string').parseUrl(link);
    expect(query.recordRef).toBe(NEW_ID);
    expect(query.ws).toBe('ws-alpha'); // workspace preserved
    expect(query.new).toBeUndefined(); // new-mode markers dropped
    expect(query.draftId).toBeUndefined();
  });
});
