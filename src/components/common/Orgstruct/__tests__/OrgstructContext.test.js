/**
 * @jest-environment jsdom
 */
import { act, render } from '@testing-library/react';
import React from 'react';

import { OrgstructContext, OrgstructProvider } from '../OrgstructContext';
import { TabTypes } from '../constants';

import { OrgStructApi } from '@/api/orgStruct';

const Consumer = ({ captureRef }) => {
  const ctx = React.useContext(OrgstructContext);
  captureRef.current = ctx;
  return null;
};

const createDeferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

const makeGroupUser = (shortName, displayName) => ({
  nodeRef: `emodel/person@${shortName}`,
  displayName,
  shortName,
  fullName: displayName,
  authorityType: 'USER'
});

describe('OrgstructContext rootGroupName race guard (EMTC-689)', () => {
  beforeEach(() => {
    jest.spyOn(OrgStructApi, 'fetchUsernameMask').mockResolvedValue('');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const buildProps = rootGroupName => ({
    openByDefault: true,
    dataType: 'nodeRef',
    allowedAuthorityTypes: ['USER', 'GROUP'],
    rootGroupName,
    excludeAuthoritiesByName: '',
    excludeAuthoritiesByType: []
  });

  it('ignores stale in-flight _no_authority_ response when rootGroupName changes while picker is open and dispatches new group fetch', async () => {
    const first = createDeferred();
    const second = createDeferred();
    const fetchGroup = jest
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const orgStructApi = { fetchGroup };
    const ctxRef = React.createRef();
    let rendered;

    await act(async () => {
      rendered = render(
        <OrgstructProvider orgStructApi={orgStructApi} controlProps={buildProps('_no_authority_')}>
          <Consumer captureRef={ctxRef} />
        </OrgstructProvider>
      );
      await flushPromises();
    });

    expect(fetchGroup).toHaveBeenCalledTimes(1);
    expect(fetchGroup.mock.calls[0][0].query.groupName).toBe('_no_authority_');
    expect(ctxRef.current.isSearching).toBe(true);

    await act(async () => {
      rendered.rerender(
        <OrgstructProvider orgStructApi={orgStructApi} controlProps={buildProps('pdApprovers_NonICFF_CD')}>
          <Consumer captureRef={ctxRef} />
        </OrgstructProvider>
      );
      await flushPromises();
    });

    expect(fetchGroup).toHaveBeenCalledTimes(2);
    expect(fetchGroup.mock.calls[1][0].query.groupName).toBe('pdApprovers_NonICFF_CD');
    expect(fetchGroup.mock.calls[0][1].aborted).toBe(true);
    expect(fetchGroup.mock.calls[1][1].aborted).toBe(false);

    await act(async () => {
      first.resolve([makeGroupUser('stale.user', 'Stale NoAuthority User')]);
      await flushPromises();
    });

    expect(ctxRef.current.tabItems[TabTypes.LEVELS]).toEqual([]);
    expect(ctxRef.current.isSearching).toBe(true);

    await act(async () => {
      second.resolve([makeGroupUser('pdr.cd1', 'CD Approver 1')]);
      await flushPromises();
    });

    expect(ctxRef.current.isSearching).toBe(false);
    expect(ctxRef.current.tabItems[TabTypes.LEVELS].map(item => item.id)).toEqual(['emodel/person@pdr.cd1']);
  });

  it('does not overwrite resolved new group list when stale _no_authority_ response settles afterwards', async () => {
    const first = createDeferred();
    const second = createDeferred();
    const fetchGroup = jest
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const orgStructApi = { fetchGroup };
    const ctxRef = React.createRef();
    let rendered;

    await act(async () => {
      rendered = render(
        <OrgstructProvider orgStructApi={orgStructApi} controlProps={buildProps('_no_authority_')}>
          <Consumer captureRef={ctxRef} />
        </OrgstructProvider>
      );
      await flushPromises();
    });

    await act(async () => {
      rendered.rerender(
        <OrgstructProvider orgStructApi={orgStructApi} controlProps={buildProps('pdApprovers_NonICFF_CD')}>
          <Consumer captureRef={ctxRef} />
        </OrgstructProvider>
      );
      await flushPromises();
    });

    await act(async () => {
      second.resolve([makeGroupUser('pdr.cd1', 'CD Approver 1')]);
      await flushPromises();
    });

    expect(ctxRef.current.tabItems[TabTypes.LEVELS].map(item => item.id)).toEqual(['emodel/person@pdr.cd1']);
    expect(ctxRef.current.isSearching).toBe(false);

    await act(async () => {
      first.resolve([makeGroupUser('stale.user', 'Stale NoAuthority User')]);
      await flushPromises();
    });

    expect(ctxRef.current.tabItems[TabTypes.LEVELS].map(item => item.id)).toEqual(['emodel/person@pdr.cd1']);
    expect(ctxRef.current.isSearching).toBe(false);
  });

  it('re-fetches and replaces LEVELS when rootGroupName changes after previous fetch completed while open', async () => {
    const fetchGroup = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([makeGroupUser('pdr.fin1', 'Finance Approver 1')]);
    const orgStructApi = { fetchGroup };
    const ctxRef = React.createRef();
    let rendered;

    await act(async () => {
      rendered = render(
        <OrgstructProvider orgStructApi={orgStructApi} controlProps={buildProps('_no_authority_')}>
          <Consumer captureRef={ctxRef} />
        </OrgstructProvider>
      );
      await flushPromises();
    });

    expect(ctxRef.current.tabItems[TabTypes.LEVELS]).toEqual([]);
    expect(ctxRef.current.isSearching).toBe(false);

    await act(async () => {
      rendered.rerender(
        <OrgstructProvider orgStructApi={orgStructApi} controlProps={buildProps('pdApprovers_NonICFF_Fin')}>
          <Consumer captureRef={ctxRef} />
        </OrgstructProvider>
      );
      await flushPromises();
    });

    expect(fetchGroup).toHaveBeenCalledTimes(2);
    expect(fetchGroup.mock.calls[1][0].query.groupName).toBe('pdApprovers_NonICFF_Fin');
    expect(ctxRef.current.tabItems[TabTypes.LEVELS].map(item => item.id)).toEqual(['emodel/person@pdr.fin1']);
  });

  it('respects liveSearch=false on LEVELS tab and fetches search results only after explicit tree update (Enter)', async () => {
    const fetchGroup = jest
      .fn()
      .mockResolvedValueOnce([makeGroupUser('ivanov', 'Ivanov'), makeGroupUser('petrov', 'Petrov')])
      .mockResolvedValueOnce([makeGroupUser('ivanov', 'Ivanov')]);
    const orgStructApi = { fetchGroup };
    const ctxRef = React.createRef();

    await act(async () => {
      render(
        <OrgstructProvider orgStructApi={orgStructApi} controlProps={{ ...buildProps('pdApprovers_NonICFF_CD'), liveSearch: false }}>
          <Consumer captureRef={ctxRef} />
        </OrgstructProvider>
      );
      await flushPromises();
    });

    expect(fetchGroup).toHaveBeenCalledTimes(1);
    expect(fetchGroup.mock.calls[0][0].query.searchText).toBe('');

    await act(async () => {
      ctxRef.current.updateSearchText({ target: { value: 'iv' } });
      await flushPromises();
    });

    expect(ctxRef.current.searchText).toBe('iv');
    expect(fetchGroup).toHaveBeenCalledTimes(1);

    await act(async () => {
      ctxRef.current.onUpdateTree();
      await flushPromises();
    });

    expect(fetchGroup).toHaveBeenCalledTimes(2);
    expect(fetchGroup.mock.calls[1][0].query.searchText).toBe('iv');
    expect(ctxRef.current.tabItems[TabTypes.LEVELS].map(item => item.id)).toEqual(['emodel/person@ivanov']);
  });
});
