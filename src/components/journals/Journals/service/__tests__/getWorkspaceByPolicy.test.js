import 'fake-indexeddb/auto';

import { SearchInWorkspacePolicy } from '@/forms/components/custom/selectJournal/constants';

import journalsService from '../journalsService';

jest.mock('../journalsServiceApi');

jest.mock('@/helpers/urls', () => ({
  ...jest.requireActual('@/helpers/urls'),
  getWorkspaceId: jest.fn(() => 'user$admin')
}));

describe('getWorkspaceByPolicy', () => {
  describe('without currentWorkspaceId — the workspace from the URL is used', () => {
    it('all → empty list (search everywhere)', () => {
      expect(journalsService.getWorkspaceByPolicy(SearchInWorkspacePolicy.ALL, ['ws2'])).toEqual([]);
    });

    it('current → the workspace from the URL', () => {
      expect(journalsService.getWorkspaceByPolicy(SearchInWorkspacePolicy.CURRENT, [])).toEqual(['user$admin']);
    });

    it('current-and-additional → the workspace from the URL plus the additional ones', () => {
      expect(journalsService.getWorkspaceByPolicy(SearchInWorkspacePolicy.CURRENT_AND_ADDITIONAL, ['ws2'])).toEqual(['user$admin', 'ws2']);
    });

    it('only-aditional → the additional ones only', () => {
      expect(journalsService.getWorkspaceByPolicy(SearchInWorkspacePolicy.ONLY_ADDITIONAL, ['ws2'])).toEqual(['ws2']);
    });

    it('an unknown policy behaves like current', () => {
      expect(journalsService.getWorkspaceByPolicy(undefined, [])).toEqual(['user$admin']);
    });
  });

  describe('with currentWorkspaceId — it replaces the workspace from the URL', () => {
    it('current → the passed workspace', () => {
      expect(journalsService.getWorkspaceByPolicy(SearchInWorkspacePolicy.CURRENT, [], 'proj1')).toEqual(['proj1']);
    });

    it('current-and-additional → the passed workspace plus the additional ones', () => {
      expect(journalsService.getWorkspaceByPolicy(SearchInWorkspacePolicy.CURRENT_AND_ADDITIONAL, ['ws2'], 'proj1')).toEqual([
        'proj1',
        'ws2'
      ]);
    });

    it('current-and-additional deduplicates', () => {
      expect(journalsService.getWorkspaceByPolicy(SearchInWorkspacePolicy.CURRENT_AND_ADDITIONAL, ['proj1'], 'proj1')).toEqual(['proj1']);
    });

    it('all ignores the passed workspace', () => {
      expect(journalsService.getWorkspaceByPolicy(SearchInWorkspacePolicy.ALL, [], 'proj1')).toEqual([]);
    });

    it('only-aditional ignores the passed workspace', () => {
      expect(journalsService.getWorkspaceByPolicy(SearchInWorkspacePolicy.ONLY_ADDITIONAL, ['ws2'], 'proj1')).toEqual(['ws2']);
    });

    it('only-aditional returns a copy so callers cannot mutate the additional list', () => {
      const additional = ['ws2'];
      const result = journalsService.getWorkspaceByPolicy(SearchInWorkspacePolicy.ONLY_ADDITIONAL, additional);

      result.push('default');

      expect(additional).toEqual(['ws2']);
    });

    it('an empty string is treated as not passed', () => {
      expect(journalsService.getWorkspaceByPolicy(SearchInWorkspacePolicy.CURRENT, [], '')).toEqual(['user$admin']);
    });
  });
});
