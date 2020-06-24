export function reportDataPrepare(data) {
  const isValidData = data.urgent && data.today && data.later;
  const clonedData = JSON.parse(JSON.stringify(data));
  const target = isValidData ? { urgent: clonedData.urgent, today: clonedData.today, later: clonedData.later } : {};

  let totalCount = 0;

  if (Object.keys(target).length) {
    const targetKeys = Object.keys(target);
    targetKeys.forEach((key, i) => {
      const prevIndex = i === 0 ? targetKeys.length - 1 : i - 1;
      const nextIndex = i === targetKeys.length - 1 ? 0 : i + 1;

      target[key] = {
        records: target[key].records,
        count: target[key].totalCount
      };

      const recNamesEquals = (first, sec) => {
        const firstRecName = first.atts['wfm:documentEcosType'];
        const firstRecStatus = first.atts['wfm:caseStatus'];

        const secRecName = sec.atts['wfm:documentEcosType'];
        const secRecStatus = sec.atts['wfm:caseStatus'];

        return firstRecName === secRecName && firstRecStatus === secRecStatus;
      };

      target[key].records.forEach(rec => {
        const prevTarget = target[targetKeys[prevIndex]];
        const nextTarget = target[targetKeys[nextIndex]];

        if (!prevTarget.records.find(el => recNamesEquals(rec, el))) {
          prevTarget.records = [...prevTarget.records, { ...rec, count: '0' }];
        }
        if (!nextTarget.records.find(el => recNamesEquals(rec, el))) {
          nextTarget.records = [...nextTarget.records, { ...rec, count: '0' }];
        }
      });

      totalCount += Number(target[key].count);
    });
    target.totalCount = totalCount;
  }

  return target;
}

export function reportDataConvert(preparedReportData) {
  const isValidData = preparedReportData.urgent && preparedReportData.today && preparedReportData.later;
  const clonedData = JSON.parse(JSON.stringify(preparedReportData));
  const target = isValidData ? { urgent: clonedData.urgent, today: clonedData.today, later: clonedData.later } : {};

  if (Object.keys(target).length) {
    const targetKeys = Object.keys(target);

    for (const key of targetKeys) {
      target[key].records = target[key].records.map(rec => ({
        id: rec.id,
        count: rec.count,
        name: rec.atts['wfm:documentEcosType'] || '',
        status: rec.atts['wfm:caseStatus']
      }));
    }

    const sortRecs = (a, b) => (a.name + a.status > b.name + b.status ? 1 : a.name + a.status < b.name + b.status ? -1 : 0);
    target.urgent.records = target.urgent.records.sort(sortRecs);
    target.today.records = target.today.records.sort(sortRecs);
    target.later.records = target.later.records.sort(sortRecs);

    target.totalCount = clonedData.totalCount;
  }

  return target;
}
