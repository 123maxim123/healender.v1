// Healender v2.1 - LocalStorage Edition
console.log('🔥 Healender v2.1 başlatılıyor...');

// Global değişkenler
let currentDate = new Date();
let calendarData = {};
let settings = { cigarettePrice: 85 };

console.log('✅ Global değişkenler tanımlandı');

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
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const resetBtn = document.getElementById('resetBtn');

console.log('✅ DOM elementleri alındı');

// Ay isimleri
const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

// LocalStorage fonksiyonları
function saveToLocalStorage() {
    try {
        localStorage.setItem('healender_calendar', JSON.stringify(calendarData));
        localStorage.setItem('healender_settings', JSON.stringify({
            cigarettePrice: parseFloat(cigarettePrice.value) || 85
        }));
        console.log('✅ Veriler localStorage\'a kaydedildi');
    } catch (error) {
        console.error('❌ localStorage kaydetme hatası:', error);
    }
}

function loadFromLocalStorage() {
    console.log('📱 localStorage\'dan veri yükleniyor...');
    try {
        const savedCalendar = localStorage.getItem('healender_calendar');
        const savedSettings = localStorage.getItem('healender_settings');
        
        if (savedCalendar) {
            calendarData = JSON.parse(savedCalendar);
            console.log('✅ Takvim verisi yüklendi:', Object.keys(calendarData).length, 'gün');
        } else {
            console.log('ℹ️ Kayıtlı takvim verisi bulunamadı');
        }
        
        if (savedSettings) {
            settings = JSON.parse(savedSettings);
            cigarettePrice.value = settings.cigarettePrice || 85;
            console.log('✅ Ayarlar yüklendi:', settings);
        } else {
            console.log('ℹ️ Kayıtlı ayar bulunamadı, varsayılan değerler kullanılıyor');
        }
        
        renderCalendar();
        updateStats();
        console.log('✅ localStorage yükleme tamamlandı');
    } catch (error) {
        console.error('❌ localStorage yükleme hatası:', error);
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
    
    // Tıklama döngüsü: Boş → Kırmızı → Kırmızı+Mavi → Boş
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
    
    saveToLocalStorage();
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

// Veri dışa aktarma
function exportData() {
    const exportData = {
        calendarData,
        settings: { cigarettePrice: parseFloat(cigarettePrice.value) || 85 },
        exportDate: new Date().toISOString(),
        version: '2.1'
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
            
            saveToLocalStorage();
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
function resetAllData() {
    if (!confirm('Tüm veriler silinecek. Emin misiniz?')) return;
    
    calendarData = {};
    cigarettePrice.value = 85;
    
    localStorage.removeItem('healender_calendar');
    localStorage.removeItem('healender_settings');
    
    renderCalendar();
    updateStats();
    
    alert('Tüm veriler silindi!');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 DOM yüklendi, uygulama başlatılıyor...');
    
    // İlk yükleme
    loadFromLocalStorage();
    
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
        saveToLocalStorage();
        updateStats();
    });
    
    // Data management
    exportBtn.addEventListener('click', exportData);
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importData);
    resetBtn.addEventListener('click', resetAllData);
    
    // Modal kapatma
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });
    
    console.log('✅ Healender v2.1 hazır!');
});

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