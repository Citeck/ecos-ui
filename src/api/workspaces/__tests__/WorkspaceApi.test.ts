jest.mock('@/components/Records', () => ({
  query: jest.fn().mockResolvedValue({ records: [], totalCount: 0 })
}));

jest.mock('@/helpers/urls', () => ({
  getWorkspaceId: jest.fn().mockReturnValue('test-ws')
}));

import Records from '@/components/Records';
import { WorkspaceApi } from '../index';

const mockQuery = Records.query as jest.Mock;

describe('WorkspaceApi', () => {
  let api: WorkspaceApi;

  beforeEach(() => {
    api = new WorkspaceApi();
    mockQuery.mockClear();
  });

  describe('searchMyWorkspaces', () => {
    it('should include id in search predicate', async () => {
      await api.searchMyWorkspaces('test-key');

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const query = mockQuery.mock.calls[0][0].query;
      const orBlock = query.v.find((p: any) => p.t === 'or');

      expect(orBlock).toBeDefined();
      expect(orBlock.v).toEqual(
        expect.arrayContaining([
          { t: 'contains', a: 'name', v: 'test-key' },
          { t: 'contains', a: 'description', v: 'test-key' },
          { t: 'contains', a: 'id', v: 'test-key' }
        ])
      );
      expect(orBlock.v).toHaveLength(3);
    });
  });

  describe('searchPublicWorkspaces', () => {
    it('should include id in search predicate', async () => {
      await api.searchPublicWorkspaces('ws-key');

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const query = mockQuery.mock.calls[0][0].query;
      const orBlock = query.v.find((p: any) => p.t === 'or');

      expect(orBlock).toBeDefined();
      expect(orBlock.v).toEqual(
        expect.arrayContaining([
          { t: 'contains', a: 'name', v: 'ws-key' },
          { t: 'contains', a: 'description', v: 'ws-key' },
          { t: 'contains', a: 'id', v: 'ws-key' }
        ])
      );
      expect(orBlock.v).toHaveLength(3);
    });
  });
});
