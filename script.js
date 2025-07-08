class SigaraTakvimi {
    constructor() {
        this.currentDate = new Date(); // Bugünün tarihinden başla
        this.today = new Date();
        this.cigarettePrice = 85; // Varsayılan fiyat
        this.dayData = {}; // {date: {red: boolean, blue: boolean}}
        
        this.monthNames = [
            'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
        ];
        
        this.init();
    }
    
    init() {
        this.loadData();
        this.bindEvents();
        this.renderCalendar();
        this.updateStats();
    }
    
    bindEvents() {
        // Navigation buttons
        document.getElementById('prevBtn').addEventListener('click', () => this.previousMonth());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextMonth());
        
        // Settings modal
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('closeBtn').addEventListener('click', () => this.closeSettings());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveSettings());
        
        // Modal backdrop click
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                this.closeSettings();
            }
        });
        
        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSettings();
            }
        });
    }
    
    previousMonth() {
        const calendar = document.getElementById('calendar');
        calendar.style.transform = 'translateX(-100%)';
        calendar.style.opacity = '0.5';
        
        setTimeout(() => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
            
            calendar.style.transform = 'translateX(100%)';
            requestAnimationFrame(() => {
                calendar.style.transform = 'translateX(0)';
                calendar.style.opacity = '1';
            });
        }, 150);
    }
    
    nextMonth() {
        const calendar = document.getElementById('calendar');
        calendar.style.transform = 'translateX(100%)';
        calendar.style.opacity = '0.5';
        
        setTimeout(() => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
            
            calendar.style.transform = 'translateX(-100%)';
            requestAnimationFrame(() => {
                calendar.style.transform = 'translateX(0)';
                calendar.style.opacity = '1';
            });
        }, 150);
    }
    
    renderCalendar() {
        this.updateMonthDisplay();
        this.renderDays();
    }
    
    updateMonthDisplay() {
        const monthElement = document.getElementById('currentMonth');
        const monthName = this.monthNames[this.currentDate.getMonth()];
        const year = this.currentDate.getFullYear();
        monthElement.textContent = `${monthName} ${year}`;
    }
    
    renderDays() {
        const daysContainer = document.getElementById('days');
        daysContainer.innerHTML = '';
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // İlk gün ve son gün
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Haftanın ilk günü (Pazar = 0)
        const startDay = firstDay.getDay();
        
        // Önceki ayın son günleri
        const prevMonth = new Date(year, month, 0);
        for (let i = startDay - 1; i >= 0; i--) {
            const day = prevMonth.getDate() - i;
            const dayElement = this.createDayElement(day, true);
            daysContainer.appendChild(dayElement);
        }
        
        // Bu ayın günleri
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayElement = this.createDayElement(day, false);
            daysContainer.appendChild(dayElement);
        }
        
        // Sonraki ayın ilk günleri (42 gün için)
        const totalCells = 42;
        const currentCells = daysContainer.children.length;
        const remainingCells = totalCells - currentCells;
        
        for (let day = 1; day <= remainingCells; day++) {
            const dayElement = this.createDayElement(day, true);
            daysContainer.appendChild(dayElement);
        }
    }
    
    createDayElement(day, isOtherMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = 'day';
        dayElement.textContent = day;
        
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
            return dayElement;
        }
        
        const dateStr = this.getDateString(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
        const currentDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
        
        // Bugün mü?
        if (this.isSameDay(currentDay, this.today)) {
            dayElement.classList.add('today');
        }
        
        // Nokta var mı?
        if (this.dayData[dateStr]) {
            const data = this.dayData[dateStr];
            if (data.red) {
                const redDot = document.createElement('div');
                redDot.className = 'day-dot red';
                dayElement.appendChild(redDot);
            }
            if (data.blue) {
                const blueDot = document.createElement('div');
                blueDot.className = 'day-dot blue';
                dayElement.appendChild(blueDot);
            }
        }
        
        // Click event
        dayElement.addEventListener('click', () => this.onDayClick(dateStr));
        
        return dayElement;
    }
    
    onDayClick(dateStr) {
        if (!this.dayData[dateStr]) {
            this.dayData[dateStr] = { red: false, blue: false, clickCount: 0 };
        }
        
        const data = this.dayData[dateStr];
        if (data.clickCount === undefined) data.clickCount = 0;
        
        // Döngüsel tıklama sistemi:
        // 0: Boş → Kırmızı
        // 1: Kırmızı → Kırmızı+Mavi  
        // 2: Kırmızı+Mavi → Kırmızı (mavi sil)
        // 3: Kırmızı → Boş (kırmızı sil)
        
        data.clickCount = (data.clickCount + 1) % 4;
        
        switch(data.clickCount) {
            case 1: // Kırmızı ekle
                data.red = true;
                data.blue = false;
                break;
            case 2: // Mavi ekle
                data.red = true;
                data.blue = true;
                break;
            case 3: // Mavi sil
                data.red = true;
                data.blue = false;
                break;
            case 0: // Her şeyi sil
                data.red = false;
                data.blue = false;
                break;
        }
        
        this.saveData();
        this.renderCalendar();
        this.updateStats();
        
        // Haptic feedback simulation
        this.vibrate();
    }
    
    vibrate() {
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }
    
    updateStats() {
        const savedMoney = this.calculateSavedMoney();
        const totalInvestment = this.calculateTotalInvestment();
        
        document.getElementById('savedMoney').textContent = `${savedMoney.toLocaleString('tr-TR')} ₺`;
        document.getElementById('totalInvestment').textContent = `${totalInvestment.toLocaleString('tr-TR')} ₺`;
    }
    
    calculateSavedMoney() {
        let redDots = 0;
        for (const date in this.dayData) {
            if (this.dayData[date].red) {
                redDots++;
            }
        }
        return redDots * this.cigarettePrice;
    }
    
    calculateTotalInvestment() {
        // Tarih sıralaması için tüm tarihleri al
        const sortedDates = Object.keys(this.dayData).sort();
        let totalInvestment = 0;
        let redCount = 0;
        
        for (const date of sortedDates) {
            const data = this.dayData[date];
            
            if (data.red) {
                redCount++;
            }
            
            if (data.blue) {
                // Mavi nokta geldiğinde şimdiye kadarki kırmızı noktaları hesapla
                totalInvestment += redCount * this.cigarettePrice;
                redCount = 0; // Sayacı sıfırla
            }
        }
        
        return totalInvestment;
    }
    
    openSettings() {
        const modal = document.getElementById('settingsModal');
        const priceInput = document.getElementById('cigarettePrice');
        
        priceInput.value = this.cigarettePrice;
        modal.classList.add('active');
        
        // Focus input
        setTimeout(() => priceInput.focus(), 100);
    }
    
    closeSettings() {
        const modal = document.getElementById('settingsModal');
        modal.classList.remove('active');
    }
    
    saveSettings() {
        const priceInput = document.getElementById('cigarettePrice');
        const newPrice = parseFloat(priceInput.value);
        
        if (newPrice && newPrice > 0) {
            this.cigarettePrice = newPrice;
            this.saveData();
            this.updateStats();
            this.closeSettings();
            
            // Success feedback
            this.showToast('Ayarlar kaydedildi!');
        } else {
            // Error feedback
            this.showToast('Geçerli bir fiyat girin!', 'error');
        }
    }
    
    showToast(message, type = 'success') {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#FF3B30' : '#34C759'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: toastIn 0.3s ease;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
    
    getDateString(year, month, day) {
        return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
    
    isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }
    
    saveData() {
        const data = {
            cigarettePrice: this.cigarettePrice,
            dayData: this.dayData
        };
        localStorage.setItem('sigaraTakvimi', JSON.stringify(data));
    }
    
    loadData() {
        const saved = localStorage.getItem('sigaraTakvimi');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.cigarettePrice = data.cigarettePrice || 85;
                this.dayData = data.dayData || {};
            } catch (e) {
                console.error('Veri yükleme hatası:', e);
            }
        }
    }
}

// CSS animations for toast
const style = document.createElement('style');
style.textContent = `
    @keyframes toastIn {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes toastOut {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SigaraTakvimi();
});

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
} 