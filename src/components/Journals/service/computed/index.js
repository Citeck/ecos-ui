import computedResolversRegistry from './computedResolversRegistry';

import ScriptResolver from './ScriptResolver';
import AttributesResolver from './AttributesResolver';
import QueryResolver from './QueryResolver';

export { default } from './computedResolversRegistry';

computedResolversRegistry.register(new ScriptResolver());
computedResolversRegistry.register(new AttributesResolver());
computedResolversRegistry.register(new QueryResolver());
