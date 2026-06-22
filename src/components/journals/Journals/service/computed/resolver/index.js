import computedResolversRegistry from './computedResolversRegistry';

import ScriptResolver from './ScriptResolver';
import AttributesResolver from './AttributesResolver';
import QueryResolver from './QueryResolver';
import ValueResolver from './ValueResolver';
import TypeRecordsResolver from './TypeRecordsResolver';

export { default } from './computedResolversRegistry';

computedResolversRegistry.register(new ScriptResolver());
computedResolversRegistry.register(new AttributesResolver());
computedResolversRegistry.register(new QueryResolver());
computedResolversRegistry.register(new ValueResolver());
computedResolversRegistry.register(new TypeRecordsResolver());
