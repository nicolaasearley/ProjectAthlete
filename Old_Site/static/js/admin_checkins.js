// Admin Check-Ins Management
document.addEventListener('DOMContentLoaded', function() {
    loadCheckInStats();
    loadAllCheckIns();
    
    const filterBtn = document.getElementById('filterCheckinsBtn');
    const refreshBtn = document.getElementById('refreshCheckinsBtn');
    
    if (filterBtn) {
        filterBtn.addEventListener('click', function() {
            loadAllCheckIns();
        });
    }
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadCheckInStats();
            loadAllCheckIns();
        });
    }
});

function loadCheckInStats() {
    fetch('/api/checkin/stats')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error loading check-in stats:', data.error);
                return;
            }
            
            const statsWidget = document.getElementById('checkinStats');
            if (!statsWidget) return;
            
            let html = `
                <div class="checkin-stats-grid">
                    <div class="checkin-stat-card">
                        <div class="stat-label">Today</div>
                        <div class="stat-value">${data.today.total_checkins}</div>
                        <div class="stat-subtext">${data.today.unique_users} unique users</div>
                    </div>
                    <div class="checkin-stat-card">
                        <div class="stat-label">This Week</div>
                        <div class="stat-value">${data.this_week.total_checkins}</div>
                        <div class="stat-subtext">${data.this_week.unique_users} unique users</div>
                    </div>
                    <div class="checkin-stat-card">
                        <div class="stat-label">This Month</div>
                        <div class="stat-value">${data.this_month.total_checkins}</div>
                        <div class="stat-subtext">check-ins</div>
                    </div>
                </div>
            `;
            
            if (data.streak_leaders && data.streak_leaders.length > 0) {
                html += `
                    <div class="checkin-streak-leaders">
                        <h3>Streak Leaders</h3>
                        <div class="streak-leaders-list">
                `;
                data.streak_leaders.slice(0, 5).forEach(leader => {
                    html += `
                        <div class="streak-leader-item">
                            <div class="profile-icon-small" data-initials="${leader.initials}">${leader.initials}</div>
                            <div class="streak-leader-info">
                                <div class="streak-leader-name">${escapeHtml(leader.name)}</div>
                                <div class="streak-leader-streak">${leader.streak} day streak</div>
                            </div>
                        </div>
                    `;
                });
                html += `
                        </div>
                    </div>
                `;
            }
            
            statsWidget.innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading check-in stats:', error);
        });
}

function loadAllCheckIns() {
    const startDate = document.getElementById('checkinStartDate')?.value || '';
    const endDate = document.getElementById('checkinEndDate')?.value || '';
    
    let url = '/api/checkin/all';
    const params = [];
    if (startDate) params.push(`start_date=${startDate}`);
    if (endDate) params.push(`end_date=${endDate}`);
    if (params.length > 0) {
        url += '?' + params.join('&');
    }
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error loading check-ins:', data.error);
                const tableContainer = document.getElementById('checkinsTable');
                if (tableContainer) {
                    tableContainer.innerHTML = '<div class="error-message">Error loading check-ins.</div>';
                }
                return;
            }
            
            const tableContainer = document.getElementById('checkinsTable');
            if (!tableContainer) return;
            
            if (data.checkins && data.checkins.length > 0) {
                let html = `
                    <table class="checkins-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                
                data.checkins.forEach(checkin => {
                    // Parse date and time properly, handling timezone
                    const date = new Date(checkin.date + 'T00:00:00');
                    const checkInTime = new Date(checkin.check_in_time);
                    const formattedDate = date.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        weekday: 'short',
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    });
                    const formattedTime = checkInTime.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    });
                    
                    html += `
                        <tr>
                            <td>
                                <div class="checkin-user-cell">
                                    <div class="profile-icon-small" data-initials="${checkin.user_initials || '?'}">${checkin.user_initials || '?'}</div>
                                    <span>${escapeHtml(checkin.user_name || 'Unknown')}</span>
                                </div>
                            </td>
                            <td>${formattedDate}</td>
                            <td>${formattedTime}</td>
                            <td>${checkin.notes ? escapeHtml(checkin.notes) : '<em>No notes</em>'}</td>
                        </tr>
                    `;
                });
                
                html += `
                        </tbody>
                    </table>
                    <div class="checkins-table-footer">
                        Total: ${data.total} check-ins
                    </div>
                `;
                
                tableContainer.innerHTML = html;
            } else {
                tableContainer.innerHTML = '<div class="checkins-empty">No check-ins found for the selected date range.</div>';
            }
        })
        .catch(error => {
            console.error('Error loading check-ins:', error);
            const tableContainer = document.getElementById('checkinsTable');
            if (tableContainer) {
                tableContainer.innerHTML = '<div class="error-message">Error loading check-ins.</div>';
            }
        });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

