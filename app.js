// Configuration
const START_HOUR = 0;
const END_HOUR = 24;
const DAYS_TO_SHOW = 7;

// State
window.currentDate = new Date().toISOString().split('T')[0]; // Acts as start date of the week
window.dailyData = {}; // Format: { "YYYY-MM-DD": { "0": { checked: true, task: "...", duration: 60 } } }
window.userProfile = { name: '', role: '', roleOther: '' };

// Helper to get dates for the week
window.getWeekDates = function(startDateStr) {
    const dates = [];
    const startDate = new Date(startDateStr);
    for (let i = 0; i < DAYS_TO_SHOW; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
}

window.changeWeek = function(offset) {
    const date = new Date(window.currentDate);
    date.setDate(date.getDate() + (offset * 7));
    window.currentDate = date.toISOString().split('T')[0];
    
    // Update date picker
    const datePicker = document.getElementById('date-picker');
    if (datePicker) datePicker.value = window.currentDate;
    
    renderSlots();
    updateSummary();
}

// Initialization
window.init = function() {
    // Load data from localStorage
    const savedData = localStorage.getItem('timeTrackerData');
    if (savedData) window.dailyData = JSON.parse(savedData);

    const savedProfile = localStorage.getItem('timeTrackerProfile');
    if (savedProfile) window.userProfile = JSON.parse(savedProfile);

    // DOM Elements
    const datePicker = document.getElementById('date-picker');
    const userNameInput = document.getElementById('user-name');
    const userRoleSelect = document.getElementById('user-role');
    const userRoleOtherInput = document.getElementById('user-role-other');

    if (datePicker) {
        // Set UI values
        datePicker.value = window.currentDate;
        if(userNameInput) userNameInput.value = window.userProfile.name || '';
        if(userRoleSelect) userRoleSelect.value = window.userProfile.role || '';
        if(userRoleOtherInput) userRoleOtherInput.value = window.userProfile.roleOther || '';
        
        toggleOtherRole();

        renderSlots();
        updateSummary();

        // Event Listeners
        datePicker.addEventListener('change', (e) => {
            window.currentDate = e.target.value;
            renderSlots();
            updateSummary();
        });

        // Profile listeners
        if(userNameInput) userNameInput.addEventListener('input', (e) => saveProfile('name', e.target.value));
        if(userRoleSelect) userRoleSelect.addEventListener('change', (e) => {
            saveProfile('role', e.target.value);
            toggleOtherRole();
        });
        if(userRoleOtherInput) userRoleOtherInput.addEventListener('input', (e) => saveProfile('roleOther', e.target.value));
    }
}

window.saveProfile = function(key, value) {
    window.userProfile[key] = value;
    localStorage.setItem('timeTrackerProfile', JSON.stringify(window.userProfile));
}

window.toggleOtherRole = function() {
    const userRoleSelect = document.getElementById('user-role');
    const otherRoleContainer = document.getElementById('other-role-container');
    
    if (userRoleSelect && otherRoleContainer) {
        if (userRoleSelect.value === 'Others') {
            otherRoleContainer.classList.remove('hidden');
        } else {
            otherRoleContainer.classList.add('hidden');
        }
    }
}


// Render Slots
window.renderSlots = function() {
    const headerContainer = document.getElementById('grid-header');
    const bodyContainer = document.getElementById('grid-body');
    
    if (!headerContainer || !bodyContainer) return;

    headerContainer.innerHTML = '';
    bodyContainer.innerHTML = '';

    const weekDates = getWeekDates(window.currentDate);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // 1. Render Header
    // Empty corner cell
    const corner = document.createElement('div');
    corner.className = "font-bold text-gray-500 text-center flex items-center justify-center";
    corner.textContent = "Time / Date";
    headerContainer.appendChild(corner);

    weekDates.forEach(dateStr => {
        const dateObj = new Date(dateStr);
        const dayName = dayNames[dateObj.getDay()];
        const displayDate = `${dayName} ${dateObj.getDate()}/${dateObj.getMonth()+1}`;
        
        const div = document.createElement('div');
        div.className = "font-bold text-gray-700 text-center bg-gray-50 p-2 rounded border";
        div.innerHTML = `<div class="text-xs text-gray-500">${dayName}</div><div>${dateObj.getDate()}/${dateObj.getMonth()+1}</div>`;
        headerContainer.appendChild(div);
    });

    // 2. Render Body (Rows = Hours)
    for (let h = START_HOUR; h < END_HOUR; h++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = "grid grid-cols-8 gap-2";
        
        // Time Label Column
        const timeLabel = document.createElement('div');
        timeLabel.className = "flex items-center justify-center text-xs font-bold text-gray-500 bg-gray-100 rounded";
        timeLabel.textContent = `${h.toString().padStart(2, '0')}:00`;
        rowDiv.appendChild(timeLabel);

        // Day Columns
        weekDates.forEach(dateStr => {
            const dayData = window.dailyData[dateStr] || {};
            const slotData = dayData[h] || { checked: false, task: '', duration: 60 };
            
            const cell = document.createElement('div');
            // Check if slot has data to style it
            const hasData = slotData.task.trim().length > 0 || slotData.checked;
            
            cell.className = `relative p-1 border rounded transition-colors h-24 flex flex-col gap-1 ${hasData ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200 hover:border-indigo-300'}`;
            
            cell.innerHTML = `
                <textarea 
                    class="w-full h-full text-xs resize-none bg-transparent focus:outline-none p-1" 
                    placeholder="Task..."
                    oninput="updateTaskGrid('${dateStr}', ${h}, this.value)"
                >${slotData.task}</textarea>
                <div class="absolute bottom-1 right-1 opacity-50 hover:opacity-100">
                     <input type="number" 
                        min="0" max="60" 
                        class="w-10 text-[10px] border rounded text-center bg-white" 
                        value="${slotData.duration}"
                        onchange="updateDurationGrid('${dateStr}', ${h}, this.value)"
                        title="Duration (min)"
                    >
                </div>
            `;
            rowDiv.appendChild(cell);
        });

        bodyContainer.appendChild(rowDiv);
    }
}

// Actions for Grid
window.updateTaskGrid = function(dateStr, hour, value) {
    if (!window.dailyData[dateStr]) window.dailyData[dateStr] = {};
    if (!window.dailyData[dateStr][hour]) {
        window.dailyData[dateStr][hour] = { checked: true, task: '', duration: 60 };
    }
    
    window.dailyData[dateStr][hour].task = value;
    // Auto-check if task has content
    window.dailyData[dateStr][hour].checked = value.trim().length > 0;
    
    saveData();
    updateSummary(); // Only update numbers, don't re-render entire grid to keep focus
    
    // Optional: visual feedback without re-render
    const activeClass = 'bg-indigo-50';
    // This is hard to target without IDs, but re-render is expensive while typing.
    // We rely on CSS :focus or simple class toggle if we had a ref.
    // For now, let it be.
};

window.updateDurationGrid = function(dateStr, hour, value) {
    if (!window.dailyData[dateStr]) window.dailyData[dateStr] = {};
    if (!window.dailyData[dateStr][hour]) {
        window.dailyData[dateStr][hour] = { checked: true, task: '', duration: 60 };
    }
    
    let val = parseInt(value);
    if (isNaN(val) || val < 0) val = 0;
    if (val > 60) val = 60;
    
    window.dailyData[dateStr][hour].duration = val;
    saveData();
    updateSummary();
};

window.saveData = function() {
    localStorage.setItem('timeTrackerData', JSON.stringify(window.dailyData));
}

window.updateSummary = function() {
    const totalTimeDisplay = document.getElementById('total-time');
    const weekDates = getWeekDates(window.currentDate);
    let totalMinutes = 0;
    
    weekDates.forEach(dateStr => {
        const dayData = window.dailyData[dateStr] || {};
        Object.values(dayData).forEach(slot => {
            if (slot.checked) {
                totalMinutes += (parseInt(slot.duration) || 0);
            }
        });
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if(totalTimeDisplay) {
        totalTimeDisplay.textContent = `${hours}h ${minutes}m`;
    }
    
    return { hours, minutes, totalMinutes };
}

window.exportToCSV = function() {
    const data = prepareExportData();
    if (data.length === 0) {
        alert("No data to export!");
        return;
    }

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => Object.values(row).map(val => `"${val}"`).join(","));
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `time_log_${window.userProfile.name || 'user'}_week_${window.currentDate}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
}

window.exportToXLSX = function() {
    const data = prepareExportData();
    if (data.length === 0) {
        alert("No data to export!");
        return;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TimeLog");
    XLSX.writeFile(wb, `time_log_${window.userProfile.name || 'user'}_week_${window.currentDate}.xlsx`);
}

window.prepareExportData = function() {
    const exportRows = [];
    const weekDates = getWeekDates(window.currentDate);
    const role = window.userProfile.role === 'Others' ? window.userProfile.roleOther : window.userProfile.role;

    weekDates.forEach(dateStr => {
        const dayData = window.dailyData[dateStr] || {};
        for (let i = START_HOUR; i < END_HOUR; i++) {
            const slot = dayData[i];
            if (slot && slot.checked) {
                exportRows.push({
                    Date: dateStr,
                    Name: window.userProfile.name || "Unknown",
                    Role: role || "Unknown",
                    Time: `${i.toString().padStart(2, '0')}:00 - ${(i + 1).toString().padStart(2, '0')}:00`,
                    Task: slot.task || "",
                    Duration_Minutes: slot.duration
                });
            }
        }
    });
    
    return exportRows;
}

window.connectGoogleDrive = function() {
    alert("Google Drive Integration requires a Google Cloud Project Client ID.\n\nTo enable this:\n1. Create a project in Google Cloud Console.\n2. Enable Google Drive and Sheets API.\n3. Create OAuth 2.0 Client ID.\n4. Add your CLIENT_ID in the source code.\n\nFor now, please use the 'Download .csv' or '.xlsx' buttons and upload to Drive manually.");
}


