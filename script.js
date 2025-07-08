// Healender v2.0 - Firebase Edition
// Global değişkenler
let currentDate = new Date();
let calendarData = {};
let settings = { cigarettePrice: 85 };
let isFirebaseReady = false;
let currentUser = null;

// DOM Elementleri
const calendar = document.getElementById('calendar');
const monthYear = document.getElementById('monthYear');
const prevMonth = document.getElementById('prevMonth');
const nextMonth = document.getElementById('nextMonth');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const cigarettePrice = document.getElementById('cigarettePrice');
const smokeFreeValue = document.getElementById('smokeFreeValue');
const moneySavedValue = document.getElementById('moneySavedValue');
const moneyInvestedValue = document.getElementById('moneyInvestedValue');

// Firebase Status Elements
const firebaseStatus = document.getElementById('firebaseStatus');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const syncIndicator = document.getElementById('syncIndicator');
const syncText = document.getElementById('syncText');
const forceSyncBtn = document.getElementById('forceSyncBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const resetBtn = document.getElementById('resetBtn');
const lastUpdate = document.getElementById('lastUpdate');

// Ay isimleri
const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

// Firebase bağlantı kontrolü
function checkFirebaseConnection() {
    if (typeof firebase !== 'undefined' && db) {
        // Basit bir test yazısı
        db.collection('test').doc('connection').get()
            .then(() => {
                isFirebaseReady = true;
                updateConnectionStatus(true);
                initializeUser();
            })
            .catch((error) => {
                console.error('Firebase bağlantı hatası:', error);
                isFirebaseReady = false;
                updateConnectionStatus(false);
                loadFromLocalStorage();
            });
    } else {
        isFirebaseReady = false;
        updateConnectionStatus(false);
        loadFromLocalStorage();
    }
}

// Bağlantı durumu güncelle
function updateConnectionStatus(online) {
    const indicator = statusIndicator;
    const text = statusText;
    const syncInd = syncIndicator;
    const syncTxt = syncText;
    
    if (online) {
        indicator.className = 'status-indicator online';
        text.textContent = 'Bağlandı';
        if (syncInd) {
            syncInd.className = 'sync-indicator online';
            syncTxt.textContent = 'Senkronize';
        }
    } else {
        indicator.className = 'status-indicator offline';
        text.textContent = 'Çevrimdışı';
        if (syncInd) {
            syncInd.className = 'sync-indicator offline';
            syncTxt.textContent = 'Çevrimdışı';
        }
    }
}

// Kullanıcı başlatma (Anonymous auth)
async function initializeUser() {
    try {
        // Anonymous authentication
        const userCredential = await firebase.auth().signInAnonymously();
        currentUser = userCredential.user;
        console.log('Anonymous kullanıcı giriş yaptı:', currentUser.uid);
        
        await loadFromFirestore();
        setupRealtimeListeners();
    } catch (error) {
        console.error('Kullanıcı giriş hatası:', error);
        loadFromLocalStorage();
    }
}

// Firestore'dan veri yükleme
async function loadFromFirestore() {
    if (!currentUser) return;
    
    try {
        updateSyncStatus('loading');
        
        // Ayarları yükle
        const settingsDoc = await db.collection('users').doc(currentUser.uid).collection('data').doc('settings').get();
        if (settingsDoc.exists) {
            settings = settingsDoc.data();
            cigarettePrice.value = settings.cigarettePrice || 85;
        }
        
        // Takvim verilerini yükle
        const calendarDoc = await db.collection('users').doc(currentUser.uid).collection('data').doc('calendar').get();
        if (calendarDoc.exists) {
            calendarData = calendarDoc.data().days || {};
        }
        
        updateSyncStatus('synced');
        updateStats();
        renderCalendar();
        updateLastUpdateTime();
        
    } catch (error) {
        console.error('Firestore yükleme hatası:', error);
        updateSyncStatus('error');
        loadFromLocalStorage();
    }
}

// Firestore'a veri kaydetme
async function saveToFirestore(type = 'all') {
    if (!currentUser || !isFirebaseReady) {
        saveToLocalStorage();
        return;
    }
    
    try {
        updateSyncStatus('saving');
        
        const userRef = db.collection('users').doc(currentUser.uid).collection('data');
        
        if (type === 'all' || type === 'settings') {
            await userRef.doc('settings').set({
                cigarettePrice: parseFloat(cigarettePrice.value) || 85,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        if (type === 'all' || type === 'calendar') {
            await userRef.doc('calendar').set({
                days: calendarData,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        updateSyncStatus('synced');
        updateLastUpdateTime();
        
    } catch (error) {
        console.error('Firestore kaydetme hatası:', error);
        updateSyncStatus('error');
        saveToLocalStorage();
    }
}

// Gerçek zamanlı dinleyiciler kurma
function setupRealtimeListeners() {
    if (!currentUser) return;
    
    const userRef = db.collection('users').doc(currentUser.uid).collection('data');
    
    // Takvim verilerini dinle
    userRef.doc('calendar').onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            if (data.days && JSON.stringify(data.days) !== JSON.stringify(calendarData)) {
                calendarData = data.days;
                renderCalendar();
                updateStats();
            }
        }
    });
    
    // Ayarları dinle
    userRef.doc('settings').onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            if (data.cigarettePrice !== settings.cigarettePrice) {
                settings.cigarettePrice = data.cigarettePrice;
                cigarettePrice.value = data.cigarettePrice;
                updateStats();
            }
        }
    });
}

// Sync durumu güncelle
function updateSyncStatus(status) {
    const syncInd = syncIndicator;
    const syncTxt = syncText;
    
    if (!syncInd || !syncTxt) return;
    
    switch (status) {
        case 'loading':
            syncInd.className = 'sync-indicator loading';
            syncTxt.textContent = 'Yükleniyor...';
            break;
        case 'saving':
            syncInd.className = 'sync-indicator saving';
            syncTxt.textContent = 'Kaydediliyor...';
            break;
        case 'synced':
            syncInd.className = 'sync-indicator online';
            syncTxt.textContent = 'Senkronize';
            break;
        case 'error':
            syncInd.className = 'sync-indicator offline';
            syncTxt.textContent = 'Hata';
            break;
    }
}

// LocalStorage fallback fonksiyonları
function saveToLocalStorage() {
    localStorage.setItem('healender_calendar', JSON.stringify(calendarData));
    localStorage.setItem('healender_settings', JSON.stringify({
        cigarettePrice: parseFloat(cigarettePrice.value) || 85
    }));
}

function loadFromLocalStorage() {
    try {
        const savedCalendar = localStorage.getItem('healender_calendar');
        const savedSettings = localStorage.getItem('healender_settings');
        
        if (savedCalendar) {
            calendarData = JSON.parse(savedCalendar);
        }
        
        if (savedSettings) {
            settings = JSON.parse(savedSettings);
            cigarettePrice.value = settings.cigarettePrice || 85;
        }
        
        renderCalendar();
        updateStats();
    } catch (error) {
        console.error('LocalStorage yükleme hatası:', error);
    }
}

// Takvim render etme
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    monthYear.textContent = `${months[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    let calendarHTML = '<div class="weekdays">';
    const weekdays = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    weekdays.forEach(day => {
        calendarHTML += `<div class="weekday">${day}</div>`;
    });
    calendarHTML += '</div><div class="days">';
    
    // Önceki ayın günleri
    for (let i = 0; i < firstDayWeek; i++) {
        calendarHTML += '<div class="day other-month"></div>';
    }
    
    // Bu ayın günleri
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayData = calendarData[dateStr] || {};
        const isToday = isDateToday(year, month, day);
        
        let dayClass = 'day';
        if (isToday) dayClass += ' today';
        
        let dotsHTML = '';
        if (dayData.red) {
            dotsHTML += '<div class="dot red-dot"></div>';
        }
        if (dayData.blue) {
            dotsHTML += '<div class="dot blue-dot"></div>';
        }
        
        calendarHTML += `
            <div class="${dayClass}" data-date="${dateStr}">
                <span class="day-number">${day}</span>
                <div class="dots">${dotsHTML}</div>
            </div>
        `;
    }
    
    calendarHTML += '</div>';
    calendar.innerHTML = calendarHTML;
    
    // Gün tıklama event'leri
    document.querySelectorAll('.day:not(.other-month)').forEach(dayEl => {
        dayEl.addEventListener('click', handleDayClick);
    });
}

// Gün tıklama işlemi
function handleDayClick(e) {
    const dateStr = e.currentTarget.getAttribute('data-date');
    if (!dateStr) return;
    
    const currentData = calendarData[dateStr] || {};
    
    // Tıklama döngüsü: Boş → Kırmızı → Kırmızı+Mavi → Sadece Kırmızı → Boş
    if (!currentData.red && !currentData.blue) {
        // Boş → Kırmızı
        calendarData[dateStr] = { red: true, blue: false };
    } else if (currentData.red && !currentData.blue) {
        // Kırmızı → Kırmızı+Mavi
        calendarData[dateStr] = { red: true, blue: true };
    } else if (currentData.red && currentData.blue) {
        // Kırmızı+Mavi → Boş
        delete calendarData[dateStr];
    }
    
    saveToFirestore('calendar');
    renderCalendar();
    updateStats();
}

// Bugün kontrolü
function isDateToday(year, month, day) {
    const today = new Date();
    return today.getFullYear() === year && 
           today.getMonth() === month && 
           today.getDate() === day;
}

// İstatistikleri güncelle
function updateStats() {
    const price = parseFloat(cigarettePrice.value) || 85;
    
    let smokeFreeCount = 0;
    let totalSaved = 0;
    let totalInvested = 0;
    let consecutiveReds = 0;
    
    // Tarihleri sırala
    const sortedDates = Object.keys(calendarData).sort();
    
    for (const dateStr of sortedDates) {
        const dayData = calendarData[dateStr];
        
        if (dayData.red) {
            smokeFreeCount++;
            totalSaved += price;
            consecutiveReds++;
        }
        
        if (dayData.blue) {
            // Mavi gün öncesindeki kırmızı günlerin parasını yatırıma ekle
            totalInvested += consecutiveReds * price;
            consecutiveReds = 0;
        }
        
        if (!dayData.red) {
            consecutiveReds = 0;
        }
    }
    
    smokeFreeValue.textContent = smokeFreeCount;
    moneySavedValue.textContent = `${totalSaved.toFixed(0)} ₺`;
    moneyInvestedValue.textContent = `${totalInvested.toFixed(0)} ₺`;
}

// Son güncelleme zamanını güncelle
function updateLastUpdateTime() {
    const now = new Date();
    lastUpdate.textContent = now.toLocaleString('tr-TR');
}

// Veri dışa aktarma
function exportData() {
    const exportData = {
        calendarData,
        settings: { cigarettePrice: parseFloat(cigarettePrice.value) || 85 },
        exportDate: new Date().toISOString(),
        version: '2.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `healender-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Veri içe aktarma
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (importedData.calendarData) {
                calendarData = importedData.calendarData;
            }
            
            if (importedData.settings && importedData.settings.cigarettePrice) {
                cigarettePrice.value = importedData.settings.cigarettePrice;
            }
            
            saveToFirestore('all');
            renderCalendar();
            updateStats();
            
            alert('Veriler başarıyla içe aktarıldı!');
        } catch (error) {
            console.error('Import hatası:', error);
            alert('Dosya formatı hatalı!');
        }
    };
    reader.readAsText(file);
}

// Tüm verileri sil
async function resetAllData() {
    if (!confirm('Tüm veriler silinecek. Emin misiniz?')) return;
    
    calendarData = {};
    cigarettePrice.value = 85;
    
    if (currentUser && isFirebaseReady) {
        try {
            const userRef = db.collection('users').doc(currentUser.uid).collection('data');
            await userRef.doc('calendar').delete();
            await userRef.doc('settings').delete();
        } catch (error) {
            console.error('Firestore silme hatası:', error);
        }
    }
    
    localStorage.removeItem('healender_calendar');
    localStorage.removeItem('healender_settings');
    
    renderCalendar();
    updateStats();
    
    alert('Tüm veriler silindi!');
}

// Manuel senkronizasyon
async function forceSync() {
    if (!isFirebaseReady) {
        alert('Firebase bağlantısı yok!');
        return;
    }
    
    updateSyncStatus('saving');
    await saveToFirestore('all');
    await loadFromFirestore();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Navigation
    prevMonth.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    nextMonth.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    // Settings
    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'flex';
    });
    
    closeSettings.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });
    
    cigarettePrice.addEventListener('input', () => {
        settings.cigarettePrice = parseFloat(cigarettePrice.value) || 85;
        saveToFirestore('settings');
        updateStats();
    });
    
    // Data management
    exportBtn.addEventListener('click', exportData);
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importData);
    resetBtn.addEventListener('click', resetAllData);
    forceSyncBtn.addEventListener('click', forceSync);
    
    // Modal kapatma
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });
    
    // Firebase bağlantısını kontrol et
    setTimeout(checkFirebaseConnection, 1000);
});

// Firebase Authentication state listener
if (typeof firebase !== 'undefined') {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            console.log('Kullanıcı durumu değişti:', user.uid);
        }
    });
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
} 