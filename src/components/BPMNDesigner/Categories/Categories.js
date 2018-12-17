import React from 'react';
import Category from '../Category';
import Models from '../Models';

function Categories() {
  return (
    <div>
      <Category label="Департамент дизайна" level={0}>
        <Models />
        {/* TODO: pass category id or items */}
        <Category label="Отдел ландшафтного дизайна" level={1}>
          <Models />
          <Category label="Заголовок третьего уровня" level={2}>
            <Models />
          </Category>
          <Category label="Заголовок третьего уровня2" level={2} isEditable={true}>
            <Models />
          </Category>
        </Category>
        <Category label="Отдел ландшафтного дизайна" level={1} isEditable={true}>
          <Models />
        </Category>
      </Category>

      <Category label="Департамент чего-то там" level={0} isEditable={true}>
        <Models />
      </Category>
    </div>
  );
}

export default Categories;
