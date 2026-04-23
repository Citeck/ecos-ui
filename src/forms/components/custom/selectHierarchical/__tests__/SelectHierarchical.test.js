import Records from '../../../../../components/Records';
import SelectHierarchicalFormComponent from '../SelectHierarchical';

jest.mock('../../../../../components/Records', () => ({
  get: jest.fn()
}));

/**
 * Creates a mock formio component context for testing SelectHierarchicalFormComponent methods.
 * Binds prototype methods from the real class so `this.resolveTypeRef()` etc. work.
 */
function createMockContext(overrides = {}) {
  const ctx = {
    component: {
      key: 'department',
      typeRef: '',
      multiple: false,
      properties: {},
      ...overrides.component
    },
    root: {
      options: {},
      ...overrides.root
    },
    dataValue: 'dataValue' in overrides ? overrides.dataValue : '',
    disabled: false,
    getAttributeToEdit() {
      return (this.component.properties || {}).attribute || this.component.key;
    },
    getRecord() {
      return {
        load: jest.fn().mockResolvedValue(overrides.recordTypeRef || '')
      };
    },
    onReactValueChanged: jest.fn(),
    get emptyValue() {
      return this.component.multiple ? [] : '';
    }
  };

  // Bind real prototype methods so getInitialReactProps can call them via `this`
  ctx.resolveTypeRef = SelectHierarchicalFormComponent.prototype.resolveTypeRef.bind(ctx);
  ctx.loadAssociations = SelectHierarchicalFormComponent.prototype.loadAssociations.bind(ctx);

  return ctx;
}

function mockRecordsLoad(typeRef, modelAttributes) {
  Records.get.mockImplementation(ref => ({
    load: jest.fn().mockImplementation(attr => {
      if (attr === 'model.attributes[]{id,type,config.typeRef,configChild:config.child?bool}') {
        return Promise.resolve(ref === typeRef ? modelAttributes : []);
      }
      if (attr === '_type?id') {
        return Promise.resolve(typeRef);
      }
      return Promise.resolve(null);
    })
  }));
}

describe('SelectHierarchicalFormComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInitialReactProps — association lookup', () => {
    const TYPE_REF = 'emodel/type@example:example';
    const MODEL_ATTRS = [
      { id: 'label', type: 'TEXT', config: {} },
      { id: 'children', type: 'ASSOC', config: TYPE_REF }
    ];

    it('with explicit typeRef: finds self-association by config match, not by field name', async () => {
      const ctx = createMockContext({
        component: { key: 'department', typeRef: TYPE_REF, multiple: false }
      });

      mockRecordsLoad(TYPE_REF, MODEL_ATTRS);

      const props = await SelectHierarchicalFormComponent.prototype.getInitialReactProps.call(ctx);

      expect(props.error).toBeUndefined();
      expect(props.typeRef).toBe(TYPE_REF);
      expect(props.selfAssociation).toBeDefined();
      expect(props.selfAssociation.id).toBe('children');
      // attribute passed to React should be the association's id, not the form key
      expect(props.attribute).toBe('children');
    });

    it('without explicit typeRef: finds association by form field key', async () => {
      const ctx = createMockContext({
        component: { key: 'children', typeRef: '', multiple: true },
        recordTypeRef: TYPE_REF
      });

      mockRecordsLoad(TYPE_REF, MODEL_ATTRS);

      const props = await SelectHierarchicalFormComponent.prototype.getInitialReactProps.call(ctx);

      expect(props.error).toBeUndefined();
      expect(props.typeRef).toBe(TYPE_REF);
      expect(props.selfAssociation.id).toBe('children');
      expect(props.attribute).toBe('children');
    });

    it('without explicit typeRef: ASSOCIATION_NOT_FOUND if field key does not match any ASSOC', async () => {
      const ctx = createMockContext({
        component: { key: 'department', typeRef: '', multiple: false },
        recordTypeRef: TYPE_REF
      });

      mockRecordsLoad(TYPE_REF, MODEL_ATTRS);

      const props = await SelectHierarchicalFormComponent.prototype.getInitialReactProps.call(ctx);

      expect(props.error).toBe('ASSOCIATION_NOT_FOUND');
      expect(props.typeRef).toBe(TYPE_REF);
    });

    it('with explicit typeRef: ASSOCIATION_NOT_FOUND if no ASSOC has matching config', async () => {
      const OTHER_TYPE = 'emodel/type@other';
      const ctx = createMockContext({
        component: { key: 'department', typeRef: OTHER_TYPE, multiple: false }
      });

      mockRecordsLoad(OTHER_TYPE, [
        { id: 'name', type: 'TEXT', config: {} },
        { id: 'ref', type: 'ASSOC', config: 'emodel/type@different' }
      ]);

      const props = await SelectHierarchicalFormComponent.prototype.getInitialReactProps.call(ctx);

      expect(props.error).toBe('ASSOCIATION_NOT_FOUND');
    });

    it('ASSOCIATION_NOT_SELF if ASSOC found by name but config does not match typeRef', async () => {
      const ctx = createMockContext({
        component: { key: 'parent', typeRef: '', multiple: false },
        recordTypeRef: TYPE_REF
      });

      mockRecordsLoad(TYPE_REF, [
        { id: 'parent', type: 'ASSOC', config: 'emodel/type@other-type' }
      ]);

      const props = await SelectHierarchicalFormComponent.prototype.getInitialReactProps.call(ctx);

      expect(props.error).toBe('ASSOCIATION_NOT_SELF');
      expect(props.associationTarget).toBe('emodel/type@other-type');
    });

    it('TYPE_NOT_RESOLVED if no typeRef available', async () => {
      const ctx = createMockContext({
        component: { key: 'department', typeRef: '', multiple: false },
        recordTypeRef: ''
      });

      mockRecordsLoad('', []);

      const props = await SelectHierarchicalFormComponent.prototype.getInitialReactProps.call(ctx);

      expect(props.error).toBe('TYPE_NOT_RESOLVED');
    });
  });

  describe('getInitialReactProps — value handling', () => {
    const TYPE_REF = 'emodel/type@example:example';
    const MODEL_ATTRS = [
      { id: 'children', type: 'ASSOC', config: TYPE_REF }
    ];

    it('passes dataValue to React component', async () => {
      const ctx = createMockContext({
        component: { key: 'department', typeRef: TYPE_REF, multiple: false },
        dataValue: 'emodel/example:example@some-uuid'
      });

      mockRecordsLoad(TYPE_REF, MODEL_ATTRS);

      const props = await SelectHierarchicalFormComponent.prototype.getInitialReactProps.call(ctx);

      expect(props.value).toBe('emodel/example:example@some-uuid');
    });

    it('uses emptyValue for null dataValue', async () => {
      const ctx = createMockContext({
        component: { key: 'department', typeRef: TYPE_REF, multiple: true },
        dataValue: null
      });

      mockRecordsLoad(TYPE_REF, MODEL_ATTRS);

      const props = await SelectHierarchicalFormComponent.prototype.getInitialReactProps.call(ctx);

      expect(props.value).toEqual([]);
    });

    it('passes multiple flag', async () => {
      const ctx = createMockContext({
        component: { key: 'department', typeRef: TYPE_REF, multiple: true }
      });

      mockRecordsLoad(TYPE_REF, MODEL_ATTRS);

      const props = await SelectHierarchicalFormComponent.prototype.getInitialReactProps.call(ctx);

      expect(props.multiple).toBe(true);
    });
  });

  describe('resolveTypeRef', () => {
    it('prefers component.typeRef over record type', async () => {
      const ctx = createMockContext({
        component: { key: 'x', typeRef: 'emodel/type@explicit' },
        recordTypeRef: 'emodel/type@from-record'
      });

      mockRecordsLoad('emodel/type@explicit', []);

      const typeRef = await SelectHierarchicalFormComponent.prototype.resolveTypeRef.call(ctx);

      expect(typeRef).toBe('emodel/type@explicit');
    });

    it('falls back to root.options.typeRef', async () => {
      const ctx = createMockContext({
        component: { key: 'x', typeRef: '' },
        root: { options: { typeRef: 'emodel/type@from-options' } }
      });

      const typeRef = await SelectHierarchicalFormComponent.prototype.resolveTypeRef.call(ctx);

      expect(typeRef).toBe('emodel/type@from-options');
    });

    it('falls back to record._type', async () => {
      const ctx = createMockContext({
        component: { key: 'x', typeRef: '' },
        recordTypeRef: 'emodel/type@from-record'
      });

      const typeRef = await SelectHierarchicalFormComponent.prototype.resolveTypeRef.call(ctx);

      expect(typeRef).toBe('emodel/type@from-record');
    });
  });

  describe('loadAssociations', () => {
    it('filters only ASSOC type attributes', async () => {
      const TYPE_REF = 'emodel/type@test';
      const ctx = createMockContext();

      Records.get.mockImplementation(() => ({
        load: jest.fn().mockResolvedValue([
          { id: 'name', type: 'TEXT', config: {} },
          { id: 'parent', type: 'ASSOC', config: TYPE_REF },
          { id: 'desc', type: 'MLTEXT', config: {} }
        ])
      }));

      const result = await SelectHierarchicalFormComponent.prototype.loadAssociations.call(ctx, TYPE_REF);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('parent');
      expect(result[0].type).toBe('ASSOC');
    });

    it('returns empty array for empty typeRef', async () => {
      const ctx = createMockContext();
      const result = await SelectHierarchicalFormComponent.prototype.loadAssociations.call(ctx, '');

      expect(result).toEqual([]);
    });

    it('returns empty array on error', async () => {
      const ctx = createMockContext();
      Records.get.mockImplementation(() => ({
        load: jest.fn().mockRejectedValue(new Error('network'))
      }));

      const result = await SelectHierarchicalFormComponent.prototype.loadAssociations.call(ctx, 'emodel/type@test');

      expect(result).toEqual([]);
    });
  });
});
