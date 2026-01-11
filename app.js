// Configuration
const START_HOUR = 0;
const END_HOUR = 24;

// State
window.currentDate = new Date().toISOString().split('T')[0];
window.dailyData = {}; // Format: { "YYYY-MM-DD": { "0": { checked: true, task: "...", duration: 60 } } }
window.userProfile = { name: '', role: '', roleOther: '' };

// Initialization
window.init = function() {
    // Load data from localStorage
    const savedData = localStorage.getItem('timeTrackerData');
    if (savedData) window.dailyData = JSON.parse(savedData);

    const savedProfile = localStorage.getItem('timeTrackerProfile');
    if (savedProfile) window.userProfile = JSON.parse(savedProfile);

    // DOM Elements - only try to get them if we are in the real app context
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
        
        toggleOtherRole(); // Update visibility based on loaded value

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
    const container = document.getElementById('slots-container');
    if (!container) return;

    container.innerHTML = '';
    const dayData = window.dailyData[window.currentDate] || {};

    for (let i = START_HOUR; i < END_HOUR; i++) {
        const hourLabel = `${i.toString().padStart(2, '0')}:00 - ${(i + 1).toString().padStart(2, '0')}:00`;
        const slotData = dayData[i] || { checked: false, task: '', duration: 60 };
        
        const div = document.createElement('div');
        div.className = `slot-row flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-lg border border-gray-200 ${slotData.checked ? 'slot-active' : 'slot-inactive'}`;
        
        div.innerHTML = `
            <div class="flex items-center gap-4 min-w-[180px]">
                <input type="checkbox" 
                    id="check-${i}" 
                    class="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                    ${slotData.checked ? 'checked' : ''}
                    onchange="toggleSlot(${i}, this.checked)"
                >
                <label for="check-${i}" class="font-medium text-gray-700 cursor-pointer select-none">${hourLabel}</label>
            </div>
            
            <div class="flex-1 w-full transition-opacity duration-200 ${slotData.checked ? 'opacity-100' : 'opacity-50 pointer-events-none'}">
                <input type="text" 
                    placeholder="Enter task description..." 
                    class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value="${slotData.task}"
                    oninput="updateTask(${i}, this.value)"
                    ${slotData.checked ? '' : 'disabled'}
                >
            </div>

            <div class="w-full md:w-32 transition-opacity duration-200 ${slotData.checked ? 'opacity-100' : 'opacity-0 pointer-events-none'}">
                <div class="flex items-center gap-2">
                    <input type="number" 
                        min="1" max="60"
                        class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                        value="${slotData.duration}"
                        onchange="updateDuration(${i}, this.value)"
                    >
                    <span class="text-sm text-gray-500">min</span>
                </div>
            </div>
        `;
        container.appendChild(div);
    }
}

// Actions
window.toggleSlot = function(hour, isChecked) {
    if (!window.dailyData[window.currentDate]) window.dailyData[window.currentDate] = {};
    
    if (!window.dailyData[window.currentDate][hour]) {
        window.dailyData[window.currentDate][hour] = { checked: isChecked, task: '', duration: 60 };
    } else {
        window.dailyData[window.currentDate][hour].checked = isChecked;
    }
    
    saveData();
    renderSlots(); // Re-render to update styles
    updateSummary();
};

window.updateTask = function(hour, value) {
    ensureSlot(hour);
    window.dailyData[window.currentDate][hour].task = value;
    saveData();
};

window.updateDuration = function(hour, value) {
    ensureSlot(hour);
    let val = parseInt(value);
    if (isNaN(val) || val < 0) val = 0;
    if (val > 60) val = 60;
    window.dailyData[window.currentDate][hour].duration = val;
    saveData();
    updateSummary();
};

window.ensureSlot = function(hour) {
    if (!window.dailyData[window.currentDate]) window.dailyData[window.currentDate] = {};
    if (!window.dailyData[window.currentDate][hour]) {
        window.dailyData[window.currentDate][hour] = { checked: true, task: '', duration: 60 };
    }
}

window.saveData = function() {
    localStorage.setItem('timeTrackerData', JSON.stringify(window.dailyData));
}

window.updateSummary = function() {
    const totalTimeDisplay = document.getElementById('total-time');
    const dayData = window.dailyData[window.currentDate] || {};
    let totalMinutes = 0;
    
    Object.values(dayData).forEach(slot => {
        if (slot.checked) {
            totalMinutes += (parseInt(slot.duration) || 0);
        }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if(totalTimeDisplay) {
        totalTimeDisplay.textContent = `${hours}h ${minutes}m`;
    }
    
    return { hours, minutes, totalMinutes }; // Return for testing
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
    link.setAttribute("download", `time_log_${window.userProfile.name || 'user'}_${window.currentDate}.csv`);
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
    XLSX.writeFile(wb, `time_log_${window.userProfile.name || 'user'}_${window.currentDate}.xlsx`);
}

window.prepareExportData = function() {
    const exportRows = [];
    const dayData = window.dailyData[window.currentDate] || {};
    const role = window.userProfile.role === 'Others' ? window.userProfile.roleOther : window.userProfile.role;

    for (let i = START_HOUR; i < END_HOUR; i++) {
        const slot = dayData[i];
        if (slot && slot.checked) {
            exportRows.push({
                Date: window.currentDate,
                Name: window.userProfile.name || "Unknown",
                Role: role || "Unknown",
                Time: `${i.toString().padStart(2, '0')}:00 - ${(i + 1).toString().padStart(2, '0')}:00`,
                Task: slot.task || "",
                Duration_Minutes: slot.duration
            });
        }
    }
    return exportRows;
}

window.connectGoogleDrive = function() {
    alert("Google Drive Integration requires a Google Cloud Project Client ID.\n\nTo enable this:\n1. Create a project in Google Cloud Console.\n2. Enable Google Drive and Sheets API.\n3. Create OAuth 2.0 Client ID.\n4. Add your CLIENT_ID in the source code.\n\nFor now, please use the 'Download .csv' or '.xlsx' buttons and upload to Drive manually.");
}

