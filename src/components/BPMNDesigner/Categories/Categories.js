import React from 'react';
import Category from '../Category';
import Models from '../Models';

// isParentHasNotModels={true} выстаялять только для первых элементов!
function Categories() {
  return (
    <div>
      <Category label="Департамент дизайна" level={0}>
        <Models items={4} />
        {/* TODO: pass category id or items */}
        <Category label="Отдел ландшафтного дизайна" level={1}>
          <Models items={0} />
          <Category label="Заголовок третьего уровня" level={2} isParentHasNotModels={true}>
            <Models items={4} />
          </Category>
          <Category label="Заголовок третьего уровня2" level={2} isEditable={true}>
            <Models items={4} />
          </Category>
        </Category>
        <Category label="Отдел ландшафтного дизайна" level={1} isEditable={true}>
          <Models items={4} />
        </Category>
      </Category>

      <Category label="Департамент чего-то там" level={0} isEditable={true}>
        <Models items={4} />
      </Category>
    </div>
  );
}

export default Categories;
