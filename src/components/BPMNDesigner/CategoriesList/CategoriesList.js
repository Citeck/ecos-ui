import React from 'react';
import Category from '../Category';
import ModelList from '../ModelList';

function CategoriesList() {
  return (
    <div>
      <Category label="Департамент дизайна" level={0}>
        <ModelList />
        {/* TODO: pass category id or items */}
        <Category label="Отдел ландшафтного дизайна" level={1}>
          <ModelList />
          <Category label="Заголовок третьего уровня" level={2}>
            <ModelList />
          </Category>
          <Category label="Заголовок третьего уровня2" level={2} isEditable={true}>
            <ModelList />
          </Category>
        </Category>
        <Category label="Отдел ландшафтного дизайна" level={1} isEditable={true}>
          <ModelList />
        </Category>
      </Category>

      <Category label="Департамент чего-то там" level={0} isEditable={true}>
        <ModelList />
      </Category>
    </div>
  );
}

export default CategoriesList;
