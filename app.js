// Initial app state
const defaultState = {
    daysChecked: 0,
    totalEarnings: 0,
    lastCheckInDate: null, // format: YYYY-MM-DD
    deposits: 100,
    checkInHistory: [],
    startDate: null
};

let appState = { ...defaultState };

// DOM Elements
const els = {
    viewDashboard: document.getElementById('view-dashboard'),
    viewPreview: document.getElementById('view-preview'),
    viewCalendar: document.getElementById('view-calendar'),
    daysChecked: document.getElementById('days-checked'),
    totalEarnings: document.getElementById('total-earnings'),
    progressCircle: document.getElementById('progress-circle'),
    btnCheckin: document.getElementById('btn-checkin'),
    cameraInput: document.getElementById('camera-input'),
    previewImage: document.getElementById('preview-image'),
    posterArea: document.getElementById('poster-card'),
    btnBack: document.getElementById('btn-back'),
    btnGeneratePoster: document.getElementById('btn-generate-poster'),
    toast: document.getElementById('toast'),
    currentDayBadge: document.getElementById('current-day-badge'),
    
    // Poster Elements
    posterTime: document.getElementById('poster-time'),
    posterDate: document.getElementById('poster-date'),
    posterDay: document.getElementById('poster-day'),
    posterQuote: document.getElementById('poster-quote')
};

const quotes = [
    "星光不问赶路人，时光不负考研人。",
    "你现在的态度，决定你十年后的高度。",
    "将来的你，一定会感谢现在拼命的自己。",
    "不要假装很努力，因为结果不会陪你演戏。",
    "既然选择了远方，便只顾风雨兼程。",
    "每一个清晨的早起，都是为了更好的未来。",
    "考研是一场自己与自己的战争。",
    "熬过无人问津的日子，才有诗和远方。",
    "成功不在于你起步有多晚，而在于你能坚持多久。",
    "那些看似不起波澜的日复一日，会在某天让人看到坚持的意义。",
    "不是因为看到了希望才去坚持，而是坚持了才能看到希望。",
    "你的负担将变成礼物，你受的苦将照亮你的路。",
    "当你觉得晚了的时候，恰恰是最早的时候。",
    "想要不可替代，就必须与众不同。",
    "比你优秀的人还在努力，你有什么资格说放弃。",
    "所有的为时已晚，其实都是恰逢其时。",
    "不负光阴不负自己，不负被爱不负所爱。",
    "只有极致的拼搏，才能配得上极度的渴望。",
    "黑夜无论怎样悠长，白昼总会到来。",
    "考研路虽然孤独，但顶峰的风景一定很美。",
    "耐得住寂寞，才能守得住繁华。",
    "为了遇见更好的自己，今天的汗水都是值得的。",
    "你坚持的东西，总有一天会反过来拥抱你。",
    "没有一次挣扎是徒劳的。",
    "所有的光芒，都需要时间才能被看到。",
    "不要在最该奋斗的年纪，选择安逸。",
    "如果这世界上真有奇迹，那只是努力的另一个名字。",
    "你要悄悄拔尖，然后惊艳所有人。",
    "今天的早起，是为了明天的自由。",
    "考研，是一场为了梦想的孤注一掷！"
];

// Initialize app
function init() {
    feather.replace();
    loadState();
    updateDashboard();
    setupEventListeners();
}

function loadState() {
    const saved = localStorage.getItem('weakup_state');
    if (saved) {
        try {
            appState = { ...defaultState, ...JSON.parse(saved) };
        } catch(e) {
            console.error("Local storage parsing error");
        }
    }
}

function saveState() {
    localStorage.setItem('weakup_state', JSON.stringify(appState));
}

function updateDashboard() {
    els.daysChecked.innerText = appState.daysChecked;
    els.totalEarnings.innerText = appState.totalEarnings;
    els.currentDayBadge.innerText = Math.min(appState.daysChecked + 1, 30);
    
    // Check if already checked in today
    const today = new Date().toISOString().split('T')[0];
    if (appState.lastCheckInDate === today) {
        els.btnCheckin.innerHTML = '<i data-feather="check"></i> 今日已打卡';
        els.btnCheckin.classList.remove('pulse-anim');
        els.btnCheckin.style.opacity = '0.7';
        feather.replace();
    } else {
        els.btnCheckin.innerHTML = '<i data-feather="camera"></i> 起床拍照打卡';
        els.btnCheckin.classList.add('pulse-anim');
        els.btnCheckin.style.opacity = '1';
        feather.replace();
    }

    // Update circular progress (circumference is ~326)
    const maxDays = 30;
    const progressPercent = Math.min(appState.daysChecked / maxDays, 1);
    const circumference = 52 * 2 * Math.PI; // r=52
    const offset = circumference - (progressPercent * circumference);
    els.progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    els.progressCircle.style.strokeDashoffset = offset;
}

function showToast(msg, duration = 3000) {
    els.toast.innerText = msg;
    els.toast.classList.remove('hidden');
    setTimeout(() => {
        els.toast.classList.add('hidden');
    }, duration);
}

// Format time HH:MM AM/PM
function formatTime(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    minutes = minutes < 10 ? '0'+minutes : minutes;
    return `${hours}:${minutes} ${ampm}`;
}

// Format date YYYY.MM.DD
function formatDate(date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}.${m}.${d}`;
}

// Check time constraint (06:40 AM limit)
let testMode = false;
function checkTimeValid(date) {
    if (testMode) return true;
    const hours = date.getHours();
    const mins = date.getMinutes();
    // Before 6:40 AM
    if (hours < 6) return true;
    if (hours === 6 && mins <= 40) return true;
    return false;
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';
    
    if (!appState.startDate) {
        grid.innerHTML = '<div style="grid-column: span 5; text-align: center; color: var(--text-muted); font-size: 13px; padding: 30px 10px; line-height: 1.6;">还没有打卡记录哦<br>从明天早晨开始挑战吧！</div>';
        return;
    }

    const start = new Date(appState.startDate);
    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < 30; i++) {
        const cellDate = new Date(start);
        cellDate.setDate(start.getDate() + i);
        const cellDateStr = cellDate.toISOString().split('T')[0];
        
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';
        
        const m = (cellDate.getMonth() + 1).toString().padStart(2, '0');
        const d = cellDate.getDate().toString().padStart(2, '0');
        
        if (appState.checkInHistory && appState.checkInHistory.includes(cellDateStr)) {
            cell.classList.add('active');
            cell.innerHTML = `
                <div class="calendar-cell-num">${i + 1}</div>
                <div class="calendar-cell-date">${m}.${d}</div>
                <i data-feather="check" style="width: 12px; height: 12px; margin-top: 4px;"></i>
            `;
        } else if (cellDateStr < todayStr) {
            cell.classList.add('missed');
            cell.innerHTML = `
                <div class="calendar-cell-num">${i + 1}</div>
                <div class="calendar-cell-date">${m}.${d}</div>
                <i data-feather="x" style="width: 12px; height: 12px; margin-top: 4px;"></i>
            `;
        } else if (cellDateStr === todayStr) {
            cell.innerHTML = `
                <div class="calendar-cell-num">${i + 1}</div>
                <div class="calendar-cell-date">今天</div>
            `;
            cell.style.borderColor = 'var(--primary-color)';
        } else {
            cell.innerHTML = `
                <div class="calendar-cell-num">${i + 1}</div>
                <div class="calendar-cell-date">${m}.${d}</div>
            `;
        }
        grid.appendChild(cell);
    }
    feather.replace();
}

function setupEventListeners() {
    // Secret tap to toggle test mode
    let tapCount = 0;
    document.getElementById('greeting-text').addEventListener('click', () => {
        tapCount++;
        if (tapCount === 5) {
            testMode = !testMode;
            tapCount = 0;
            showToast(`[开发者模式] 时间限制已${testMode ? '关闭' : '开启'}`);
        }
        setTimeout(() => tapCount = 0, 2000);
    });

    els.btnCheckin.addEventListener('click', () => {
        const todayStr = new Date().toISOString().split('T')[0];
        if (appState.lastCheckInDate === todayStr && !testMode) {
            showToast("今天已经打过卡啦！明天继续哦~");
            return;
        }
        
        const now = new Date();
        if (!checkTimeValid(now)) {
            showToast("哎呀！现在已经过了 06:40 啦，今天没赶上，继续加油哦！");
            return;
        }

        els.cameraInput.click();
    });

    els.cameraInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // We want a vertical 3:4 ratio output
                const targetRatio = 3 / 4;
                const srcRatio = img.width / img.height;
                
                let sWidth = img.width;
                let sHeight = img.height;
                let sx = 0;
                let sy = 0;
                
                if (srcRatio > targetRatio) {
                    // Source is wider (e.g. 16:9 landscape photo) -> crop sides
                    sWidth = img.height * targetRatio;
                    sx = (img.width - sWidth) / 2;
                } else {
                    // Source is taller -> crop top and bottom
                    sHeight = img.width / targetRatio;
                    sy = (img.height - sHeight) / 2;
                }
                
                // Set high quality output dimensions (e.g 1080x1440)
                canvas.width = 1080;
                canvas.height = 1440;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, 1080, 1440);
                
                // Get the perfectly cropped image and assign it directly
                els.previewImage.src = canvas.toDataURL('image/jpeg', 0.9);
                processCheckIn();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    els.btnBack.addEventListener('click', () => {
        switchView(els.viewPreview, els.viewDashboard);
    });

    document.getElementById('btn-calendar').addEventListener('click', () => {
        renderCalendar();
        switchView(els.viewDashboard, els.viewCalendar);
    });

    document.getElementById('btn-calendar-back').addEventListener('click', () => {
        switchView(els.viewCalendar, els.viewDashboard);
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
        if (confirm("确定要清空所有历史数据吗？清空后将完全重新开始。")) {
            localStorage.removeItem('weakup_state');
            appState = { ...defaultState, checkInHistory: [] };
            updateDashboard();
            renderCalendar();
            switchView(els.viewCalendar, els.viewDashboard);
            showToast("数据已清空，新挑战开始！", 3000);
        }
    });

    els.btnGeneratePoster.addEventListener('click', () => {
        const finalImg = document.getElementById('final-saveable-img');
        if (finalImg && finalImg.src && finalImg.src.startsWith('data:')) {
            try {
                // b64 to blob to bypass href length limit
                const dataStr = finalImg.src.split(',')[1];
                const mime = finalImg.src.split(',')[0].match(/:(.*?);/)[1];
                const bstr = atob(dataStr);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while(n--) { u8arr[n] = bstr.charCodeAt(n); }
                const blob = new Blob([u8arr], {type: mime});
                const url = window.URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `WeakUP_早起打卡_Day${appState.daysChecked}.jpg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                showToast("保存成功或已触发系统相册保存", 4000);
            } catch (err) {
                showToast("直接保存失败，请直接长按图片保存", 4000);
            }
        } else {
            generatePosterCard();
        }
    });
}

function processCheckIn() {
    const now = new Date();
    
    // Update Poster info
    els.posterTime.innerText = formatTime(now);
    els.posterDate.innerText = formatDate(now);
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    els.posterQuote.innerText = `“${randomQuote}”`;
    
    // Update internal state
    const todayStr = now.toISOString().split('T')[0];
    
    if (!appState.startDate) {
        appState.startDate = todayStr;
    }
    
    if (!appState.checkInHistory) {
        appState.checkInHistory = [];
    }
    
    // Only increment earnings if it's the first time checking in today
    if (!appState.checkInHistory.includes(todayStr)) {
        appState.checkInHistory.push(todayStr);
        appState.daysChecked += 1;
        appState.totalEarnings += 10;
        
        // Handle 30th day success logic
        if (appState.daysChecked === 30) {
            appState.totalEarnings += 100; // refund deposit
            appState.totalEarnings += 100; // extra reward (total 300 earned)
            showToast("天呐！你完成了30天挑战！额外奖励和押金已奉上！", 5000);
        }
    }
    
    appState.lastCheckInDate = todayStr;
    saveState();
    updateDashboard();

    els.posterDay.innerText = appState.daysChecked;

    // Switch view
    switchView(els.viewDashboard, els.viewPreview);

    // Auto generate the saveable image after animation
    setTimeout(generatePosterCard, 500);
}

function switchView(from, to) {
    from.classList.remove('active');
    setTimeout(() => {
        from.classList.add('hidden');
        to.classList.remove('hidden');
        // trigger reflow
        void to.offsetWidth;
        to.classList.add('active');
    }, 400); // Wait for fade out animation
}

function generatePosterCard() {
    const node = document.getElementById('poster-area');
    
    // Fix html2canvas aspect-ratio zero height bug by forcing explicit pixel geometry temporarily
    const rect = node.getBoundingClientRect();
    if(rect.width > 0) {
        node.style.height = (rect.width * (4/3)) + 'px';
    }

    // Give the DOM a tiny frame to repaint the height
    setTimeout(() => {
        html2canvas(node, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#000000'
        }).then(canvas => {
            node.style.height = ''; // Restore aspect-ratio
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            const parent = node.parentNode;
            
            node.style.display = 'none';
            
            let finalImg = document.getElementById('final-saveable-img');
            if (!finalImg) {
                finalImg = document.createElement('img');
                finalImg.id = 'final-saveable-img';
                finalImg.style.width = '100%';
                finalImg.style.borderRadius = '24px';
                finalImg.style.boxShadow = '0 16px 40px rgba(0,0,0,0.5)';
                finalImg.style.userSelect = 'none';
                finalImg.style.webkitTouchCallout = 'default';
                parent.insertBefore(finalImg, node.nextSibling);
            }
            finalImg.src = dataUrl;
            finalImg.style.display = 'block';
        }).catch(err => {
            console.error(err);
            node.style.height = ''; // Restore
            showToast("日签生成失败，请直接截屏分享哦");
        });
    }, 50);
}

// Start
document.addEventListener('DOMContentLoaded', init);
