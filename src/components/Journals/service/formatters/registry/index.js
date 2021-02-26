import FormatterRegistry from './FormatterRegistry';
import FileNameFormatter from './FileNameFormatter';
import HtmlFormatter from './HtmlFormatter';
import ScriptFormatter from './ScriptFormatter';
import WorkflowPriorityFormatter from './WorkflowPriorityFormatter';
import AssocFormatter from './AssocFormatter';
import DefaultFormatter from './DefaultFormatter';
import CardDetailsLinkFormatter from './CardDetailsLinkFormatter';

const formatterRegistry = new FormatterRegistry();

formatterRegistry.register(new DefaultFormatter());
formatterRegistry.register(new FileNameFormatter());
formatterRegistry.register(new HtmlFormatter());
formatterRegistry.register(new ScriptFormatter());
formatterRegistry.register(new WorkflowPriorityFormatter());
formatterRegistry.register(new AssocFormatter());
formatterRegistry.register(new CardDetailsLinkFormatter());

export default formatterRegistry;
