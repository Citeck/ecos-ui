import React from 'react';
import Category from '../Category';

function CategoriesList() {
  return (
    <div>
      <Category label="Департамент дизайна" level={0}>
        Список моделей...
        <Category label="Отдел ландшафтного дизайна" level={1}>
          Список моделей...
          <Category label="Заголовок третьего уровня" level={2}>
            Список моделей...
          </Category>
        </Category>
      </Category>
      <Category label="Департамент чего-то там" level={0}>
        Список моделей...
      </Category>
    </div>
  );
}

export default CategoriesList;
