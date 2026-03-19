const defaultBeverages = [
  { id: 1, name: '코카콜라', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80', stock: 10, price: 1500 },
  { id: 2, name: '스프라이트', image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=500&q=80', stock: 8, price: 1400 },
  { id: 3, name: '오렌지 주스', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&q=80', stock: 5, price: 2000 },
  { id: 4, name: '생수', image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4c?w=500&q=80', stock: 20, price: 800 }
];

const defaultUsers = [
  { id: 'admin', pin: '0000', role: 'admin', name: '관리자' },
  { id: 'user1', pin: '1234', role: 'user', name: '홍길동' },
  { id: 'user2', pin: '5678', role: 'user', name: '김철수' }
];

// Initialize LocalStorage
function initData() {
  if (!localStorage.getItem('beverages')) {
    localStorage.setItem('beverages', JSON.stringify(defaultBeverages));
  }
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify(defaultUsers));
  }
  if (!localStorage.getItem('logs')) {
    localStorage.setItem('logs', JSON.stringify([]));
  }
  if (!localStorage.getItem('wishes')) {
    localStorage.setItem('wishes', JSON.stringify([]));
  }
}

function getBeverages() {
  return JSON.parse(localStorage.getItem('beverages'));
}

function getUsers() {
  return JSON.parse(localStorage.getItem('users'));
}

function registerUser(name, phoneLast4, pin) {
  const users = getUsers();
  const newUser = {
    id: Date.now().toString(),
    name,
    phoneLast4,
    pin,
    role: 'user'
  };
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
  return newUser;
}

function updateBeverageStock(id, amount) {
  const beverages = getBeverages();
  const index = beverages.findIndex(b => String(b.id) === String(id));
  if (index !== -1) {
    beverages[index].stock += amount;
    localStorage.setItem('beverages', JSON.stringify(beverages));
  }
}

function setBeverageStock(id, newStock) {
  const beverages = getBeverages();
  const index = beverages.findIndex(b => String(b.id) === String(id));
  if (index !== -1) {
    beverages[index].stock = newStock;
    localStorage.setItem('beverages', JSON.stringify(beverages));
  }
}

function moveBeverageUp(id) {
  let beverages = getBeverages();
  const index = beverages.findIndex(b => String(b.id) === String(id));
  if (index > 0) {
    const temp = beverages[index - 1];
    beverages[index - 1] = beverages[index];
    beverages[index] = temp;
    localStorage.setItem('beverages', JSON.stringify(beverages));
  }
}

function moveBeverageDown(id) {
  let beverages = getBeverages();
  const index = beverages.findIndex(b => String(b.id) === String(id));
  if (index < beverages.length - 1 && index !== -1) {
    const temp = beverages[index + 1];
    beverages[index + 1] = beverages[index];
    beverages[index] = temp;
    localStorage.setItem('beverages', JSON.stringify(beverages));
  }
}

function addBeverage(name, imageBase64, initialStock) {
  const beverages = getBeverages();
  const newId = Date.now();
  beverages.push({
    id: newId,
    name: name,
    image: imageBase64 || 'https://images.unsplash.com/photo-1548839140-29a749e1bc4c?w=500&q=80',
    stock: parseInt(initialStock, 10),
    price: 0
  });
  localStorage.setItem('beverages', JSON.stringify(beverages));
}

function removeBeverage(id) {
  let beverages = getBeverages();
  beverages = beverages.filter(b => String(b.id) !== String(id));
  localStorage.setItem('beverages', JSON.stringify(beverages));
}

function authenticateUser(id, pin) {
  const users = JSON.parse(localStorage.getItem('users'));
  return users.find(u => u.id === id && u.pin === pin);
}

function logTransaction(userId, beverageId, action, amount) {
  const logs = JSON.parse(localStorage.getItem('logs'));
  logs.push({
    userId,
    beverageId,
    action, // 'take' or 'stock'
    amount,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('logs', JSON.stringify(logs));
}

function getWishes() {
  return JSON.parse(localStorage.getItem('wishes')) || [];
}

function addWish(text) {
  const wishes = getWishes();
  wishes.push({ id: Date.now(), text, date: new Date().toISOString() });
  localStorage.setItem('wishes', JSON.stringify(wishes));
}

function removeWish(id) {
  let wishes = getWishes();
  wishes = wishes.filter(w => String(w.id) !== String(id));
  localStorage.setItem('wishes', JSON.stringify(wishes));
}

initData();

// Delete a user (except admin)
function deleteUser(id) {
  if (id === 'admin') return; // protect admin
  let users = getUsers();
  users = users.filter(u => String(u.id) !== String(id));
  localStorage.setItem('users', JSON.stringify(users));
}
