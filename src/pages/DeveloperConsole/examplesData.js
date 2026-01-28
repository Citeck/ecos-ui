// Examples data for Developer Console
export const EXAMPLES_DATA = [
  {
    value: 'records-api-get',
    label: 'Records API Get',
    code: 'const user = await Records.get("emodel/person@admin").load("?json");\n\nreturn user;\n'
  },
  {
    value: 'records-api-update',
    label: 'Records API Update',
    code: 'const user = Records.getRecordToEdit("emodel/person@admin");\n\nuser.att("firstName",  "John");\nuser.att("lastName", "Doe");\n\nawait user.save()\n\n;return await user.load("?json");'
  },
  {
    value: 'records-api-create',
    label: 'Records API Create',
    code: 'const user = Records.get("emodel/someType@");\n\nuser.att("title", "Hello World!");\n\nawait user.save();\n\nreturn await user.load("title?str");\n'
  },
  {
    value: 'records-api-delete',
    label: 'Records API Delete',
    code: 'Records.remove("emodel/someType@id1");\nRecords.remove(["emodel/someType@id1", "emodel/someType@id2"]);\n'
  }
];

export default EXAMPLES_DATA;
