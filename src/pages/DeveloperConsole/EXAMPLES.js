// Developer Console - Примеры использования

// 1. Простой вывод в консоль
console.log('Привет из Developer Console');
console.warn('Это предупреждение');
console.error('Это ошибка');

// 2. Работа с объектами
const user = {
  id: 1,
  name: 'Admin',
  role: 'administrator',
  permissions: ['read', 'write', 'delete']
};

console.log(user);
return user;

// 3. Работа с массивами
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log('Исходный массив:', numbers);
console.log('Удвоенный массив:', doubled);
return doubled;

// 4. Асинхронные операции
async function fetchData() {
  try {
    // Пример: получить данные с API
    console.log('Загрузка данных...');

    // Здесь вы можете использовать настоящие API вашего приложения
    const response = await new Promise(resolve => {
      setTimeout(() => resolve({ status: 'success', data: 'Данные загружены' }), 10000);
    });

    console.log('Результат:', response);
    return response;
  } catch (error) {
    console.error('Ошибка при загрузке:', error);
    throw error;
  }
}

// Вызовите функцию
return await fetchData();

// 5. Работа с DOM
const header = document.querySelector('h1');
console.log('Найден элемент:', header?.textContent);
return document.title;

// 6. Математические операции
const result = Math.pow(2, 8) + Math.sqrt(16) * 3;
console.log('Результат: 2^8 + √16 * 3 =', result);
return result;

// 7. JSON операции
const json = '{"name": "Test", "value": 42}';
const parsed = JSON.parse(json);
console.log('Распарсен:', parsed);
return parsed;

// 8. Тестирование условной логики
function checkPermission(role) {
  switch (role) {
    case 'admin':
      console.log('Полные права доступа');
      return true;
    case 'user':
      console.log('Ограниченные права');
      return false;
    default:
      console.log('Неизвестная роль');
      return false;
  }
}

return checkPermission('admin');

// 9. Работа с датами
const now = new Date();
console.log('Текущая дата:', now.toLocaleString('ru-RU'));
console.log('ISO формат:', now.toISOString());
return {
  date: now.toLocaleDateString('ru-RU'),
  time: now.toLocaleTimeString('ru-RU')
};

// 10. Использование sessionStorage/localStorage
console.log('Сохраненные данные:', sessionStorage.getItem('key'));
sessionStorage.setItem('console_test', JSON.stringify({ timestamp: Date.now() }));
return 'Данные сохранены в sessionStorage';
