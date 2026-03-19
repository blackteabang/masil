document.addEventListener('DOMContentLoaded', () => {
  // Navigation
  const navBtns = document.querySelectorAll('.nav-btn');
  const views = document.querySelectorAll('.view');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      views.forEach(v => v.classList.remove('active'));
      document.getElementById(btn.dataset.target).classList.add('active');
      
      if (btn.dataset.target === 'stats-view') renderStats();
    });
  });

  const logoBtn = document.getElementById('logo-home');
  if (logoBtn) {
    logoBtn.addEventListener('click', () => {
      document.querySelector('.nav-btn[data-target="fridge-view"]').click();
    });
  }

  // Render User Select
  function renderUserSelect() {
    const select = document.getElementById('user-select');
    select.innerHTML = '<option value="">사용자를 선택하세요</option>';
    const users = getUsers().filter(u => u.role !== 'admin');
    users.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.id;
      const phoneStr = u.phoneLast4 ? ` (${u.phoneLast4})` : '';
      opt.textContent = `${u.name}${phoneStr}`;
      select.appendChild(opt);
    });
  }

  // Render Fridge Grid
  function renderFridge() {
    const grid = document.getElementById('beverage-grid');
    grid.innerHTML = '';
    const beverages = getBeverages();
    
    beverages.forEach(b => {
      const card = document.createElement('div');
      card.className = 'beverage-card';
      const isLow = b.stock < 5;
      card.innerHTML = `
        <img src="${b.image}" alt="${b.name}" class="beverage-image">
        <div class="beverage-name">${b.name}</div>
        <div class="beverage-stock">현재 재고: <span class="stock-badge ${isLow ? 'low' : ''}">${b.stock}개</span></div>
      `;
      card.addEventListener('click', () => {
        if (b.stock > 0) openAuthModal(b);
        else alert('재고가 모두 소진되었습니다.');
      });
      grid.appendChild(card);
    });
  }

  // Auth Modal Logic
  let selectedBeverage = null;
  const modal = document.getElementById('auth-modal');
  const errorMsg = document.getElementById('auth-error');
  const userSelect = document.getElementById('user-select');
  const userPhoneInput = document.getElementById('user-phone-input');

  userSelect.addEventListener('change', () => {
    if (userSelect.value) userPhoneInput.value = '';
  });
  userPhoneInput.addEventListener('input', () => {
    if (userPhoneInput.value) userSelect.value = '';
  });

  function openAuthModal(beverage) {
    selectedBeverage = beverage;
    document.getElementById('modal-beverage-name').textContent = `🧊 ${beverage.name} 꺼내기`;
    userSelect.value = '';
    userPhoneInput.value = '';
    document.getElementById('user-pin').value = '';
    errorMsg.style.display = 'none';
    modal.classList.add('active');
  }

  document.getElementById('cancel-btn').addEventListener('click', () => {
    modal.classList.remove('active');
    selectedBeverage = null;
  });

  document.getElementById('confirm-btn').addEventListener('click', () => {
    const userId = userSelect.value;
    const phone = userPhoneInput.value.trim();
    const pin = document.getElementById('user-pin').value.trim();
    
    let user = null;

    if (!userId && !phone) {
      errorMsg.textContent = '❌ 사용자를 선택하거나 휴대전화 4자리를 입력해주세요.';
      errorMsg.style.display = 'block';
      return;
    }
    if (!pin) {
      errorMsg.textContent = '❌ 비밀번호(PIN)를 입력해주세요.';
      errorMsg.style.display = 'block';
      return;
    }

    if (userId) {
      user = authenticateUser(userId, pin);
    } else if (phone) {
      const allUsers = getUsers().filter(u => u.role !== 'admin');
      const matchedUsers = allUsers.filter(u => u.phoneLast4 === phone || u.id === phone);
      user = matchedUsers.find(u => u.pin === pin);
    }
    
    if (user) {
      updateBeverageStock(selectedBeverage.id, -1);
      logTransaction(user.name, selectedBeverage.name, 'take', 1);
      modal.classList.remove('active');
      renderFridge(); // Refresh stock
      
      // Quick nice alert (could be replaced with a beautiful toast notification)
      alert(`✅ ${user.name}님, ${selectedBeverage.name}을(를) 꺼냈습니다! 시원하게 드세요.`);
    } else {
      errorMsg.textContent = '❌ 사용자 정보 또는 PIN 번호가 일치하지 않습니다.';
      errorMsg.style.display = 'block';
    }
  });

  // Registration Modal Logic
  const regModal = document.getElementById('register-modal');
  const regErrorMsg = document.getElementById('reg-error');

  document.getElementById('open-register-btn').addEventListener('click', () => {
    document.getElementById('reg-name').value = '';
    document.getElementById('reg-phone').value = '';
    document.getElementById('reg-pin').value = '';
    regErrorMsg.style.display = 'none';
    regModal.classList.add('active');
  });

  document.getElementById('reg-cancel-btn').addEventListener('click', () => {
    regModal.classList.remove('active');
  });

  document.getElementById('reg-confirm-btn').addEventListener('click', () => {
    const name = document.getElementById('reg-name').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const pin = document.getElementById('reg-pin').value.trim();

    if (!name || phone.length !== 4 || pin.length !== 4 || isNaN(phone) || isNaN(pin)) {
      regErrorMsg.textContent = '이름, 휴대전화 끝 4자리(숫자), 비밀번호 4자리(숫자)를 정확히 입력하세요.';
      regErrorMsg.style.display = 'block';
      return;
    }

    registerUser(name, phone, pin);
    renderUserSelect();
    regModal.classList.remove('active');
    alert(`🎉 ${name}님, 등록이 완료되었습니다! 이제 음료를 꺼낼 수 있습니다.`);
  });

  // Admin Logic
  const adminLoginBtn = document.getElementById('admin-login-btn');
  const adminPinInput = document.getElementById('admin-pin');
  const adminError = document.getElementById('admin-error');
  let isAdminLogged = false;

  adminLoginBtn.addEventListener('click', () => {
    const adminUser = authenticateUser('admin', adminPinInput.value);
    if (adminUser) {
      isAdminLogged = true;
      document.getElementById('admin-login-area').classList.add('hidden');
      document.getElementById('admin-dashboard').classList.remove('hidden');
      renderAdminStock();
      renderUserList();
    } else {
      adminError.textContent = '관리자 PIN이 올바르지 않습니다.';
      adminError.style.display = 'block';
    }
  });

  function renderAdminStock() {
    const list = document.getElementById('stock-list');
    if (!list) return;
    list.innerHTML = '';
    const beverages = getBeverages();
    
    const wishListEl = document.getElementById('wish-list');
    if (wishListEl) {
      wishListEl.innerHTML = '';
      const wishes = getWishes();
      if (wishes.length === 0) {
        wishListEl.innerHTML = '<li style="color:var(--text-muted); font-size:0.9rem;">접수된 신청이 없습니다.</li>';
      } else {
        wishes.forEach(w => {
          const li = document.createElement('li');
          li.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding: 0.8rem 1rem; background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);";
          li.innerHTML = `
            <span>${w.text} <span style="font-size:0.8rem; color:var(--text-muted); margin-left:0.5rem;">(${new Date(w.date).toLocaleDateString()})</span></span>
            <button class="wish-delete-btn" style="background:none; border:none; color:var(--danger); cursor:pointer; font-weight:bold; font-size:1.1rem; padding:0 0.5rem; transition:0.2s;">×</button>
          `;
          const delBtn = li.querySelector('.wish-delete-btn');
          delBtn.addEventListener('mouseover', () => delBtn.style.opacity = '0.7');
          delBtn.addEventListener('mouseout', () => delBtn.style.opacity = '1');
          delBtn.addEventListener('click', () => {
            removeWish(w.id);
            renderAdminStock();
          });
          wishListEl.appendChild(li);
        });
      }
    }

    beverages.forEach((b, index) => {
      const item = document.createElement('div');
      item.className = 'stock-item';
      item.innerHTML = `
        <div class="stock-info">
          <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-right: 0.8rem; align-items: center; justify-content: center;">
            <button class="move-up-btn" style="background: none; border: none; font-size: 1.2rem; outline: none; transition: 0.2s; color: ${index === 0 ? 'rgba(255,255,255,0.1)' : 'var(--text-muted)'}; cursor: ${index === 0 ? 'default' : 'pointer'};">▲</button>
            <button class="move-down-btn" style="background: none; border: none; font-size: 1.2rem; outline: none; transition: 0.2s; color: ${index === beverages.length - 1 ? 'rgba(255,255,255,0.1)' : 'var(--text-muted)'}; cursor: ${index === beverages.length - 1 ? 'default' : 'pointer'};">▼</button>
          </div>
          <img src="${b.image}" alt="${b.name}">
          <div>
            <div style="font-weight:600; font-size:1.1rem; margin-bottom:0.25rem;">${b.name}</div>
            <div style="font-size:0.9rem; color:#94a3b8">현재 재고: <span style="color:#fff; font-weight:600">${b.stock}개</span></div>
          </div>
        </div>
        <div class="stock-controls">
          <input type="number" min="0" value="${b.stock}" id="add-val-${b.id}">
          <button class="btn-primary add-stock-btn">변경</button>
          <button class="btn-secondary delete-stock-btn" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 0.6rem 0.8rem;">삭제</button>
        </div>
      `;
      
      const moveUpBtn = item.querySelector('.move-up-btn');
      if (index > 0) {
        moveUpBtn.addEventListener('click', () => {
          moveBeverageUp(b.id);
          renderAdminStock();
          renderFridge();
        });
        moveUpBtn.addEventListener('mouseover', () => moveUpBtn.style.color = '#fff');
        moveUpBtn.addEventListener('mouseout', () => moveUpBtn.style.color = 'var(--text-muted)');
      }

      const moveDownBtn = item.querySelector('.move-down-btn');
      if (index < beverages.length - 1) {
        moveDownBtn.addEventListener('click', () => {
          moveBeverageDown(b.id);
          renderAdminStock();
          renderFridge();
        });
        moveDownBtn.addEventListener('mouseover', () => moveDownBtn.style.color = '#fff');
        moveDownBtn.addEventListener('mouseout', () => moveDownBtn.style.color = 'var(--text-muted)');
      }

      const addBtn = item.querySelector('.add-stock-btn');
      addBtn.addEventListener('click', () => {
        const newStock = parseInt(document.getElementById(`add-val-${b.id}`).value, 10);
        if (newStock >= 0) {
          const diff = newStock - b.stock;
          if (diff !== 0) {
            setBeverageStock(b.id, newStock);
            logTransaction('관리자', b.name, 'stock', diff);
            renderAdminStock();
            renderFridge();
            alert(`📦 ${b.name} 재고가 ${newStock}개로 변경되었습니다.`);
          } else {
             alert(`⚠️ 기존 재고와 동일합니다.`);
          }
        }
      });

      const delBtn = item.querySelector('.delete-stock-btn');
      delBtn.addEventListener('click', () => {
        window.itemToDeleteId = b.id;
        document.getElementById('delete-target-name').textContent = b.name;
        document.getElementById('delete-confirm-modal').classList.add('active');
      });

      list.appendChild(item);
    });
  }

  function renderUserList() {
    const list = document.getElementById('user-list');
    if (!list) return;
    list.innerHTML = '';
    const users = getUsers().filter(u => u.role !== 'admin');

    if (users.length === 0) {
      list.innerHTML = '<li style="color:var(--text-muted); font-size:0.9rem; padding: 0.5rem;">등록된 사용자가 없습니다.</li>';
      return;
    }

    users.forEach(u => {
      const li = document.createElement('li');
      li.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding: 0.6rem 1rem; background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); flex: 1 1 180px; min-width: 150px; max-width: 250px;";
      const phoneStr = u.phoneLast4 ? ` (${u.phoneLast4})` : '';
      li.innerHTML = `
        <span style="color: white; font-weight: 500;">${u.name}${phoneStr}</span>
        <button class="user-delete-btn" style="background:none; border:none; color:#ef4444; cursor:pointer; font-weight:bold; font-size:1.1rem; padding:0 0.5rem; transition:0.2s;">×</button>
      `;
      
      const delBtn = li.querySelector('.user-delete-btn');
      delBtn.addEventListener('mouseover', () => delBtn.style.opacity = '0.7');
      delBtn.addEventListener('mouseout', () => delBtn.style.opacity = '1');
      delBtn.addEventListener('click', () => {
        window.userToDeleteId = u.id;
        document.getElementById('delete-user-name').textContent = u.name;
        document.getElementById('delete-user-confirm-modal').classList.add('active');
      });
      list.appendChild(li);
    });
  }

  // Delete Confirm Modal Logic
  document.getElementById('delete-cancel-btn').addEventListener('click', () => {
    document.getElementById('delete-confirm-modal').classList.remove('active');
    window.itemToDeleteId = null;
  });

  document.getElementById('delete-confirm-btn').addEventListener('click', () => {
    if (window.itemToDeleteId !== null && window.itemToDeleteId !== undefined) {
      removeBeverage(window.itemToDeleteId);
      renderAdminStock();
      renderFridge();
      document.getElementById('delete-confirm-modal').classList.remove('active');
      alert(`🗑️ 음료가 정상적으로 삭제되었습니다.`);
      window.itemToDeleteId = null;
    }
  });

  // Delete User Confirm Modal Logic
  document.getElementById('delete-user-cancel-btn').addEventListener('click', () => {
    document.getElementById('delete-user-confirm-modal').classList.remove('active');
    window.userToDeleteId = null;
  });

  document.getElementById('delete-user-confirm-btn').addEventListener('click', () => {
    if (window.userToDeleteId) {
      const users = getUsers();
      const user = users.find(u => String(u.id) === String(window.userToDeleteId));
      const userName = user ? user.name : 'Unknown';
      
      deleteUser(window.userToDeleteId);
      renderUserList();
      renderUserSelect();
      logTransaction('관리자', userName, 'delete_user', 1);
      
      document.getElementById('delete-user-confirm-modal').classList.remove('active');
      alert(`🗑️ [${userName}] 사용자가 정상적으로 삭제되었습니다.`);
      window.userToDeleteId = null;
    }
  });
  const addBevModal = document.getElementById('add-bev-modal');
  const addBevError = document.getElementById('add-bev-error');

  document.getElementById('open-add-bev-btn').addEventListener('click', () => {
    document.getElementById('new-bev-name').value = '';
    document.getElementById('new-bev-stock').value = '10';
    document.getElementById('new-bev-image').value = '';
    addBevError.style.display = 'none';
    addBevModal.classList.add('active');
  });

  document.getElementById('add-bev-cancel-btn').addEventListener('click', () => {
    addBevModal.classList.remove('active');
  });

  document.getElementById('add-bev-confirm-btn').addEventListener('click', () => {
    const name = document.getElementById('new-bev-name').value.trim();
    const stock = document.getElementById('new-bev-stock').value;
    const fileInput = document.getElementById('new-bev-image');
    
    if (!name || !stock || stock <= 0) {
      addBevError.textContent = '음료 이름과 유효한 수량을 입력하세요.';
      addBevError.style.display = 'block';
      return;
    }

    const file = fileInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        addBeverage(name, e.target.result, stock);
        finishAddBev(name, stock);
      };
      reader.readAsDataURL(file);
    } else {
      // Use default image if none provided
      addBeverage(name, '', stock);
      finishAddBev(name, stock);
    }
  });

  function finishAddBev(name, stock) {
    addBevModal.classList.remove('active');
    renderAdminStock();
    renderFridge();
    logTransaction('관리자', name, 'stock', parseInt(stock, 10));
    alert(`🎉 새 음료 '${name}'이(가) 추가되었습니다!`);
  }

  // Wish Modal Logic
  const wishModal = document.getElementById('wish-modal');
  const wishError = document.getElementById('wish-error');
  const wishTextInput = document.getElementById('wish-text');

  document.getElementById('open-wish-btn').addEventListener('click', () => {
    wishTextInput.value = '';
    wishError.style.display = 'none';
    wishModal.classList.add('active');
  });

  document.getElementById('wish-cancel-btn').addEventListener('click', () => {
    wishModal.classList.remove('active');
  });

  document.getElementById('wish-confirm-btn').addEventListener('click', () => {
    const text = wishTextInput.value.trim();
    if (!text) {
      wishError.textContent = '희망하시는 음료 이름을 입력해주세요.';
      wishError.style.display = 'block';
      return;
    }
    
    addWish(text);
    wishModal.classList.remove('active');
    renderAdminStock();
    alert(`💌 [${text}] 신청이 완료되었습니다! 관리자님께 전달할게요.`);
  });

  // Stats Dashboard Logic
  function renderStats() {
    const logs = JSON.parse(localStorage.getItem('logs')) || [];
    const takeLogList = document.getElementById('take-log-list');
    const stockLogList = document.getElementById('stock-log-list');
    
    if(takeLogList) takeLogList.innerHTML = '';
    if(stockLogList) stockLogList.innerHTML = '';
    
    let totalTakes = 0;
    const beverageCounts = {};

    let takesCount = 0;
    let stocksCount = 0;

    logs.slice().reverse().forEach(log => {
      const isTake = log.action === 'take';

      if (isTake) {
        totalTakes += log.amount;
        beverageCounts[log.beverageId] = (beverageCounts[log.beverageId] || 0) + log.amount;
      }
      
      const timeStr = new Date(log.timestamp).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      if (isTake && takesCount < 10) {
        takesCount++;
        const el = document.createElement('li');
        el.className = 'log-item';
        el.innerHTML = `
          <div class="log-message" style="font-size: 0.95rem;">
            <strong style="color:var(--text-main);">${log.userId}</strong> 님이 <strong>${log.beverageId}</strong> 꺼냄
          </div>
          <div class="log-time" style="font-size: 0.8rem;">${timeStr}</div>
        `;
        takeLogList.appendChild(el);
      } else if (!isTake && stocksCount < 10) {
        stocksCount++;
        const el = document.createElement('li');
        el.className = 'log-item';
        
        const diff = log.amount;
        let verbStr = '';
        let colorStr = '';
        if (diff > 0) {
           verbStr = `+${diff}개 입고`;
           colorStr = '#34d399';
        } else if (diff < 0) {
           verbStr = `${diff}개 조정`;
           colorStr = '#ef4444';
        } else {
           verbStr = `수량 변경 없음`;
           colorStr = '#94a3b8';
        }

        el.innerHTML = `
          <div class="log-message" style="font-size: 0.95rem;">
             <strong style="color:var(--text-main);">${log.userId}</strong>: ${log.beverageId} <span style="color:${colorStr}; font-weight:600; margin-left:0.3rem;">${verbStr}</span>
          </div>
          <div class="log-time" style="font-size: 0.8rem;">${timeStr}</div>
        `;
        stockLogList.appendChild(el);
      }
    });

    document.getElementById('total-consumed').textContent = `${totalTakes}개`;
    
    // Find most popular beverages
    const sortedFavs = Object.entries(beverageCounts).sort((a,b) => b[1] - a[1]).slice(0, 3);
    const popContainer = document.getElementById('popular-beverage');
    if (sortedFavs.length > 0) {
      let html = '';
      const medals = ['🥇', '🥈', '🥉'];
      sortedFavs.forEach((fav, i) => {
        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); padding: 0.8rem 1.2rem; border-radius: 12px; border: 1px solid var(--glass-border);">
            <div style="font-size: 1.05rem; font-weight: 600; color: white;">${medals[i]} ${fav[0]}</div>
            <div style="font-size: 0.9rem; color: var(--text-muted); font-weight: 500;">${fav[1]}개</div>
          </div>
        `;
      });
      popContainer.innerHTML = html;
    } else {
      popContainer.innerHTML = '<div style="text-align:center; color: var(--text-muted); font-size: 0.9rem;">소비 내역 없음</div>';
    }
  }

  // Load initial view
  renderUserSelect();
  renderFridge();
});
