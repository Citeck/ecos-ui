import { CHAT_SESSION_STORAGE_KEY, clearActiveRequestId, clearSession, loadSession, saveSession } from '../chatSessionStorage';
import { CHAT_REQUEST_RESUME_TTL_MS, CHAT_SESSION_TTL_MS } from '../constants';

const CONVERSATION_ID = 'conversation-1';
const REQUEST_ID = 'request-1';
const NOW = 1786528800000;

const readRaw = () => JSON.parse(sessionStorage.getItem(CHAT_SESSION_STORAGE_KEY));

/** Sets who `getCurrentUserName()` reports, the way the page bootstrap does. */
const setCurrentUser = userName => {
  window.Citeck = { ...window.Citeck, constants: { ...window.Citeck?.constants, USERNAME: userName } };
};

describe('chatSessionStorage', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    sessionStorage.clear();
    setCurrentUser('');
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    setCurrentUser('');
  });

  describe('saveSession / loadSession', () => {
    // Test 1
    it('stores conversationId, requestId and a timestamp and reads them back', () => {
      saveSession(CONVERSATION_ID, REQUEST_ID);

      expect(readRaw()).toEqual({
        conversationId: CONVERSATION_ID,
        requestId: REQUEST_ID,
        requestCompleted: false,
        agent: null,
        owner: null,
        savedAt: NOW
      });
      expect(loadSession()).toEqual({
        conversationId: CONVERSATION_ID,
        requestId: REQUEST_ID,
        requestCompleted: false,
        agent: null
      });
    });

    it('stores a null requestId when no request is active', () => {
      saveSession(CONVERSATION_ID);

      expect(readRaw().requestId).toBeNull();
      expect(loadSession()).toEqual({ conversationId: CONVERSATION_ID, requestId: null, requestCompleted: false, agent: null });
    });

    // The conversation is bound to its agent server-side (`AgentOrchestratorService.resolveAgentRef`
    // in citeck-ai answers from the stored `AGENT_REF` for every question that sends none), so a
    // restored conversation whose agent was forgotten leaves the chip claiming "Citeck AI" while a
    // specialised agent goes on answering.
    it('stores the selected agent and reads it back', () => {
      saveSession(CONVERSATION_ID, REQUEST_ID, { id: 'contract-agent', name: 'Договоры', engine: 'CONFIG' });

      expect(loadSession()).toEqual({
        conversationId: CONVERSATION_ID,
        requestId: REQUEST_ID,
        requestCompleted: false,
        agent: { id: 'contract-agent', name: 'Договоры', engine: 'CONFIG' }
      });
    });

    it('keeps only the fields the interface reads back', () => {
      saveSession(CONVERSATION_ID, REQUEST_ID, {
        id: 'contract-agent',
        name: 'Договоры',
        engine: 'CONFIG',
        description: 'полное описание из списка агентов',
        extra: { anything: 'else' }
      });

      // The dropdown reloads the full list from the backend when it is opened, so anything beyond
      // the chip's label and icon would only be a second, staler copy of it
      expect(readRaw().agent).toEqual({ id: 'contract-agent', name: 'Договоры', engine: 'CONFIG' });
    });

    it('stores an agent that carries nothing but an id', () => {
      saveSession(CONVERSATION_ID, REQUEST_ID, { id: 'legacy-agent' });

      expect(loadSession().agent).toEqual({ id: 'legacy-agent' });
    });

    it('refuses an agent whose id could not be sent back to the backend', () => {
      // The id is interpolated into the `agentRef` of the next question (`buildAgentRef`)
      saveSession(CONVERSATION_ID, REQUEST_ID, { id: '../../other-agent', name: 'Подменённый' });

      expect(readRaw().agent).toBeNull();
      expect(loadSession().agent).toBeNull();
    });

    it('refuses an agent that is not an object with an id', () => {
      saveSession(CONVERSATION_ID, REQUEST_ID, 'contract-agent');
      expect(loadSession().agent).toBeNull();

      saveSession(CONVERSATION_ID, REQUEST_ID, [{ id: 'contract-agent' }]);
      expect(loadSession().agent).toBeNull();

      saveSession(CONVERSATION_ID, REQUEST_ID, { name: 'Без идентификатора' });
      expect(loadSession().agent).toBeNull();
    });

    it('caps an agent name that is far too long to be a label', () => {
      saveSession(CONVERSATION_ID, REQUEST_ID, { id: 'contract-agent', name: 'д'.repeat(5000) });

      expect(loadSession().agent.name).toHaveLength(200);
    });

    it('reads back an agent a foreign writer left in a broken shape as none', () => {
      sessionStorage.setItem(
        CHAT_SESSION_STORAGE_KEY,
        JSON.stringify({ conversationId: CONVERSATION_ID, requestId: REQUEST_ID, agent: { id: 42 }, savedAt: NOW })
      );

      // The record itself is still usable — only the agent on it is not
      expect(loadSession()).toEqual({ conversationId: CONVERSATION_ID, requestId: REQUEST_ID, requestCompleted: false, agent: null });
    });

    it('drops the agent when the next save has none, rather than keeping the previous one', () => {
      saveSession(CONVERSATION_ID, REQUEST_ID, { id: 'contract-agent', name: 'Договоры' });

      // Deselecting the agent clears the conversation, but a record left claiming an agent the
      // caller no longer holds would put its name back on the chip after the next reload
      saveSession(CONVERSATION_ID, REQUEST_ID);

      expect(loadSession().agent).toBeNull();
    });

    it('ignores a save without a conversationId', () => {
      saveSession('', REQUEST_ID);

      expect(sessionStorage.getItem(CHAT_SESSION_STORAGE_KEY)).toBeNull();
    });

    // Test 2
    it('returns null when there is no record', () => {
      expect(loadSession()).toBeNull();
    });

    // Test 3
    it('returns null and drops the record when it is older than the TTL', () => {
      saveSession(CONVERSATION_ID, REQUEST_ID);
      Date.now.mockReturnValue(NOW + CHAT_SESSION_TTL_MS + 1);

      expect(loadSession()).toBeNull();
      expect(sessionStorage.getItem(CHAT_SESSION_STORAGE_KEY)).toBeNull();
    });

    it('keeps the record while it is exactly at the TTL boundary', () => {
      saveSession(CONVERSATION_ID, REQUEST_ID);
      Date.now.mockReturnValue(NOW + CHAT_SESSION_TTL_MS);

      // The conversation survives the whole window; the request is long past resuming by then.
      expect(loadSession()).toEqual({ conversationId: CONVERSATION_ID, requestId: null, requestCompleted: false, agent: null });
    });

    // The two horizons are deliberately different: citeck-ai keeps a conversation for 24 h but a
    // request result for at most 30 + 60 min, so an old record still continues the dialogue while
    // no longer resurrecting a request the backend has already forgotten.
    it('keeps the requestId while it is exactly at the resume boundary', () => {
      saveSession(CONVERSATION_ID, REQUEST_ID);
      Date.now.mockReturnValue(NOW + CHAT_REQUEST_RESUME_TTL_MS);

      expect(loadSession()).toEqual({ conversationId: CONVERSATION_ID, requestId: REQUEST_ID, requestCompleted: false, agent: null });
    });

    it('drops only the requestId once it is past the resume horizon, keeping the conversation', () => {
      saveSession(CONVERSATION_ID, REQUEST_ID);
      Date.now.mockReturnValue(NOW + CHAT_REQUEST_RESUME_TTL_MS + 1);

      expect(loadSession()).toEqual({ conversationId: CONVERSATION_ID, requestId: null, requestCompleted: false, agent: null });
      // Still on disk — the next question has to continue the same server-side conversation.
      expect(readRaw().conversationId).toBe(CONVERSATION_ID);
    });

    it('resumes a request that outlives the client polling watchdog', () => {
      // The regression this guards: the TTL used to equal the ~10 min polling window, so exactly the
      // long generations the persistence exists to rescue were the ones it threw away (D-B-14).
      saveSession(CONVERSATION_ID, REQUEST_ID);
      Date.now.mockReturnValue(NOW + 20 * 60 * 1000);

      expect(loadSession()).toEqual({ conversationId: CONVERSATION_ID, requestId: REQUEST_ID, requestCompleted: false, agent: null });
    });

    // Test 4
    it('returns null on corrupted JSON without throwing', () => {
      sessionStorage.setItem(CHAT_SESSION_STORAGE_KEY, '{not a json');

      expect(() => loadSession()).not.toThrow();
      expect(loadSession()).toBeNull();
    });

    // Left in place, an unparseable record survives every read for the life of the tab: a console
    // error on each one, and `clearActiveRequestId` reduced to a no-op because it reads before it
    // writes. It is dropped for the same reason a malformed one is.
    it('drops a corrupted record instead of reading it again', () => {
      sessionStorage.setItem(CHAT_SESSION_STORAGE_KEY, '{not a json');

      loadSession();

      expect(sessionStorage.getItem(CHAT_SESSION_STORAGE_KEY)).toBeNull();
    });

    // Test 5
    it('returns null when the record has no conversationId', () => {
      sessionStorage.setItem(CHAT_SESSION_STORAGE_KEY, JSON.stringify({ requestId: REQUEST_ID, savedAt: NOW }));

      expect(loadSession()).toBeNull();
    });

    it('returns null when the record has no timestamp', () => {
      sessionStorage.setItem(CHAT_SESSION_STORAGE_KEY, JSON.stringify({ conversationId: CONVERSATION_ID, requestId: REQUEST_ID }));

      expect(loadSession()).toBeNull();
    });

    it('normalizes a non-string requestId to null', () => {
      sessionStorage.setItem(CHAT_SESSION_STORAGE_KEY, JSON.stringify({ conversationId: CONVERSATION_ID, requestId: 42, savedAt: NOW }));

      expect(loadSession()).toEqual({ conversationId: CONVERSATION_ID, requestId: null, requestCompleted: false, agent: null });
    });
  });

  // Both identifiers are interpolated into a request path, and this record is the one place where
  // they can arrive from outside the hook's own `generateUUID` — anything running on the origin can
  // write it. A value carrying a path separator or a query character has to be refused, or the
  // DELETE behind "clear chat" can be pointed at somebody else's conversation.
  describe('identifier validation', () => {
    const write = record => sessionStorage.setItem(CHAT_SESSION_STORAGE_KEY, JSON.stringify(record));

    it.each(['../../conversation/other', 'conversation 1', 'conv?a=b', 'conv#frag', 'conv%2f1', 'a/b'])(
      'refuses a stored conversationId of %p',
      conversationId => {
        write({ conversationId, requestId: null, agent: null, owner: '', savedAt: NOW });

        expect(loadSession()).toBeNull();
      }
    );

    it.each(['../../status/other', 'req?a=b', 'req/1', 'req#1'])('drops a stored requestId of %p and keeps the conversation', requestId => {
      write({ conversationId: CONVERSATION_ID, requestId, agent: null, owner: '', savedAt: NOW });

      expect(loadSession()).toEqual({ conversationId: CONVERSATION_ID, requestId: null, requestCompleted: false, agent: null });
    });

    it.each(['../../conversation/other', 'conv?a=b', 'a/b', ''])(
      'writes nothing when asked to store the conversationId %p',
      conversationId => {
        saveSession(conversationId, REQUEST_ID);

        expect(sessionStorage.getItem(CHAT_SESSION_STORAGE_KEY)).toBeNull();
      }
    );

    it('stores the conversation but not a requestId that could retarget the path', () => {
      saveSession(CONVERSATION_ID, '../../status/other');

      expect(readRaw().conversationId).toBe(CONVERSATION_ID);
      expect(readRaw().requestId).toBeNull();
    });

    // Refusing the id also switches off the whole resume, while the chat goes on telling the user
    // to close and reopen the panel to collect the answer. Nothing else in that chain says a word,
    // so without this line the failure is undiagnosable from the browser.
    it('says so in the console when it refuses a requestId', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      saveSession(CONVERSATION_ID, '../../status/other');

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      // The value itself is never printed — only the fact that it was refused.
      expect(consoleWarnSpy.mock.calls[0][0]).not.toContain('../../status/other');
    });

    it('says nothing when there is no requestId to refuse', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      saveSession(CONVERSATION_ID);
      saveSession(CONVERSATION_ID, REQUEST_ID);

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('accepts every character a generated identifier and a record reference are made of', () => {
      saveSession('emodel/type@x'.replace('/', '_'), 'req.1:2@3-4_5');

      expect(readRaw().requestId).toBe('req.1:2@3-4_5');
    });

    it('accepts an identifier of exactly the length cap and refuses the next one', () => {
      const atCap = 'a'.repeat(128);
      saveSession(atCap);
      expect(readRaw().conversationId).toBe(atCap);

      sessionStorage.clear();
      saveSession('a'.repeat(129));
      expect(sessionStorage.getItem(CHAT_SESSION_STORAGE_KEY)).toBeNull();
    });
  });

  // `sessionStorage` is per tab, not per login: logging out and back in as somebody else in the same
  // tab leaves the record behind. `ConversationOwnerGuard` in citeck-ai answers 404 to everybody but
  // the owner — including the DELETE behind "clear chat" — so inheriting the id wedges the chat.
  describe('owner scoping', () => {
    it('stamps the record with the user who is logged in', () => {
      setCurrentUser('ivanov');

      saveSession(CONVERSATION_ID, REQUEST_ID);

      expect(readRaw().owner).toBe('ivanov');
    });

    it('returns the record to the user who wrote it', () => {
      setCurrentUser('ivanov');
      saveSession(CONVERSATION_ID, REQUEST_ID);

      expect(loadSession()).toEqual({ conversationId: CONVERSATION_ID, requestId: REQUEST_ID, requestCompleted: false, agent: null });
    });

    it('drops the record when another user has logged in since', () => {
      setCurrentUser('ivanov');
      saveSession(CONVERSATION_ID, REQUEST_ID);

      setCurrentUser('petrov');

      expect(loadSession()).toBeNull();
      expect(sessionStorage.getItem(CHAT_SESSION_STORAGE_KEY)).toBeNull();
    });

    it('keeps a record written before the user was known', () => {
      // `Citeck.constants.USERNAME` is not populated in every context; an unknown owner must not
      // cost a live conversation, exactly as the backend guard lets a blank user through.
      sessionStorage.setItem(
        CHAT_SESSION_STORAGE_KEY,
        JSON.stringify({ conversationId: CONVERSATION_ID, requestId: REQUEST_ID, savedAt: NOW })
      );
      setCurrentUser('ivanov');

      expect(loadSession()).toEqual({ conversationId: CONVERSATION_ID, requestId: REQUEST_ID, requestCompleted: false, agent: null });
    });

    it('keeps the record when the current user cannot be determined', () => {
      setCurrentUser('ivanov');
      saveSession(CONVERSATION_ID, REQUEST_ID);

      setCurrentUser('');

      expect(loadSession()).toEqual({ conversationId: CONVERSATION_ID, requestId: REQUEST_ID, requestCompleted: false, agent: null });
    });

    it('clearActiveRequestId keeps the owner when the current user cannot be determined', () => {
      // A request may finish while `Citeck.constants.USERNAME` is unavailable. Re-reading the user
      // there would stamp the record `owner: null`, and a null owner is let through — the next user
      // to log in in this tab would inherit the conversation the guard was added to protect.
      setCurrentUser('ivanov');
      saveSession(CONVERSATION_ID, REQUEST_ID);

      setCurrentUser('');
      clearActiveRequestId();

      expect(readRaw().owner).toBe('ivanov');

      setCurrentUser('petrov');
      expect(loadSession()).toBeNull();
    });

    it('clearActiveRequestId leaves the record readable by its own owner', () => {
      setCurrentUser('ivanov');
      saveSession(CONVERSATION_ID, REQUEST_ID);

      clearActiveRequestId();

      expect(readRaw().owner).toBe('ivanov');
      expect(loadSession()).toEqual({ conversationId: CONVERSATION_ID, requestId: null, requestCompleted: false, agent: null });
    });
  });

  describe('clearing', () => {
    // Test 6
    it('clearActiveRequestId drops the requestId and keeps the conversationId', () => {
      saveSession(CONVERSATION_ID, REQUEST_ID);

      clearActiveRequestId();

      expect(loadSession()).toEqual({ conversationId: CONVERSATION_ID, requestId: null, requestCompleted: false, agent: null });
    });

    it('clearActiveRequestId keeps the agent the conversation is bound to', () => {
      saveSession(CONVERSATION_ID, REQUEST_ID, { id: 'contract-agent', name: 'Договоры' });

      // Finishing a request says nothing about which agent answers in the conversation
      clearActiveRequestId();

      expect(loadSession()).toEqual({
        conversationId: CONVERSATION_ID,
        requestId: null,
        requestCompleted: false,
        agent: { id: 'contract-agent', name: 'Договоры' }
      });
    });

    it('clearActiveRequestId does nothing when there is no record', () => {
      clearActiveRequestId();

      expect(sessionStorage.getItem(CHAT_SESSION_STORAGE_KEY)).toBeNull();
    });

    // Test 7
    it('clearSession removes the whole record', () => {
      saveSession(CONVERSATION_ID, REQUEST_ID);

      clearSession();

      expect(sessionStorage.getItem(CHAT_SESSION_STORAGE_KEY)).toBeNull();
      expect(loadSession()).toBeNull();
    });
  });

  // Test 8: private browsing mode, where every sessionStorage call throws
  describe('unavailable storage', () => {
    const failing = () => {
      throw new Error('SecurityError: storage is disabled');
    };

    beforeEach(() => {
      jest.spyOn(window.sessionStorage.__proto__, 'getItem').mockImplementation(failing);
      jest.spyOn(window.sessionStorage.__proto__, 'setItem').mockImplementation(failing);
      jest.spyOn(window.sessionStorage.__proto__, 'removeItem').mockImplementation(failing);
    });

    it('loadSession returns null instead of throwing', () => {
      expect(() => loadSession()).not.toThrow();
      expect(loadSession()).toBeNull();
    });

    it('saveSession does not throw', () => {
      expect(() => saveSession(CONVERSATION_ID, REQUEST_ID)).not.toThrow();
    });

    it('clearActiveRequestId does not throw', () => {
      expect(() => clearActiveRequestId()).not.toThrow();
    });

    it('clearSession does not throw', () => {
      expect(() => clearSession()).not.toThrow();
    });

    it('reports the failure to the console instead of surfacing it', () => {
      loadSession();

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
