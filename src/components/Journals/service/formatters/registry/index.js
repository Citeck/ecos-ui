import FormatterRegistry from './FormatterRegistry';
import HtmlFormatter from './HtmlFormatter';
import ScriptFormatter from './ScriptFormatter';

const formatterRegistry = new FormatterRegistry();

formatterRegistry.register(new HtmlFormatter());
formatterRegistry.register(new ScriptFormatter());

export default formatterRegistry;
