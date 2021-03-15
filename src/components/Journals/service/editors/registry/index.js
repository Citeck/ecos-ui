import EditorRegistry from './EditorRegistry';

import DateEditor from './DateEditor';
import DateTimeEditor from './DateTimeEditor';
import JournalEditor from './JournalEditor';
import OrgstructEditor from './OrgstructEditor';
import SelectEditor from './SelectEditor';
import TextEditor from './TextEditor';
import BooleanEditor from './BooleanEditor';
import NumberEditor from './NumberEditor';

const editorRegistry = new EditorRegistry();

editorRegistry.register(new DateEditor());
editorRegistry.register(new DateTimeEditor());
editorRegistry.register(new JournalEditor());
editorRegistry.register(new OrgstructEditor());
editorRegistry.register(new SelectEditor());
editorRegistry.register(new TextEditor());
editorRegistry.register(new BooleanEditor());
editorRegistry.register(new NumberEditor());

export default editorRegistry;
