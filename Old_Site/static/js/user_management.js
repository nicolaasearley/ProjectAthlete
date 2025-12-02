let currentUserId = null;
let isAdmin = false; // Will be set from template or API

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is admin
    checkUserRole();
    loadUsers();
    
    document.getElementById('newUserBtn').addEventListener('click', function() {
        openUserEditor(null);
    });
    
    document.getElementById('closeEditorBtn').addEventListener('click', function() {
        closeUserEditor();
    });
    
    document.getElementById('userForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveUser();
    });
});

function checkUserRole() {
    // Try to get role from a data attribute or API
    const roleMeta = document.querySelector('meta[name="user-role"]');
    const adminMeta = document.querySelector('meta[name="is-admin"]');
    if (roleMeta) {
        isAdmin = adminMeta && adminMeta.content === 'true';
    }
}

function loadUsers() {
    fetch('/api/users')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(users => {
            console.log('Loaded users:', users); // Debug log
            displayUsers(users);
        })
        .catch(error => {
            console.error('Error loading users:', error);
            const container = document.getElementById('usersList');
            if (container) {
                container.innerHTML = `<p class="error-message">Error loading users: ${error.message}. Please check the browser console for details.</p>`;
            }
        });
}

function displayUsers(users) {
    const container = document.getElementById('usersList');
    
    if (users.length === 0) {
        container.innerHTML = '<p>No users found.</p>';
        return;
    }
    
    // Sort users: admins first, then coaches, then users
    users.sort((a, b) => {
        const roleOrder = { 'admin': 0, 'coach': 1, 'user': 2 };
        return roleOrder[a.role] - roleOrder[b.role];
    });
    
    let html = '<div class="workout-grid">';
    
    users.forEach(user => {
        // Coaches can only see/edit/delete users, not admins or coaches
        const canEdit = isAdmin || user.role === 'user';
        const canDelete = isAdmin || user.role === 'user';
        
        const displayName = user.first_name && user.last_name 
            ? `${user.first_name} ${user.last_name}` 
            : user.username;
        
        html += `
            <div class="workout-card">
                <div class="workout-card-header">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="profile-icon" data-initials="${user.initials || '?'}">${user.initials || '?'}</div>
                        <div>
                            <h3>${escapeHtml(displayName)}</h3>
                            <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">@${escapeHtml(user.username)}</p>
                        </div>
                    </div>
                    <span class="role-badge role-${user.role}">${user.role.toUpperCase()}</span>
                </div>
                <div class="workout-card-body">
                    <p><strong>Type:</strong> ${user.type}</p>
                    <p><strong>Created:</strong> ${user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div class="workout-card-actions">
                    ${canEdit ? `<button class="btn btn-secondary" onclick="editUser(${user.id}, '${user.type}')">Edit</button>` : ''}
                    ${canDelete ? `<button class="btn btn-danger" onclick="deleteUser(${user.id}, '${user.type}')">Delete</button>` : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function openUserEditor(userId = null) {
    currentUserId = userId;
    const editor = document.getElementById('userEditor');
    const title = document.getElementById('editorTitle');
    const form = document.getElementById('userForm');
    
    if (userId) {
        title.textContent = 'Edit User';
        loadUserForEdit(userId);
    } else {
        title.textContent = 'New User';
        form.reset();
        document.getElementById('passwordHint').style.display = 'none';
        document.getElementById('passwordInput').required = true;
        document.getElementById('roleSelect').disabled = false;
        // Coaches can only create users
        if (!isAdmin) {
            document.getElementById('roleSelect').value = 'user';
            document.getElementById('roleSelect').disabled = true;
        }
    }
    
    editor.style.display = 'block';
    editor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeUserEditor() {
    document.getElementById('userEditor').style.display = 'none';
    currentUserId = null;
    document.getElementById('userForm').reset();
    document.getElementById('editorError').style.display = 'none';
}

function loadUserForEdit(userId) {
    fetch('/api/users')
        .then(response => response.json())
        .then(users => {
            const user = users.find(u => u.id === userId);
            if (user) {
                document.getElementById('usernameInput').value = user.username || '';
                document.getElementById('firstNameInput').value = user.first_name || '';
                document.getElementById('lastNameInput').value = user.last_name || '';
                document.getElementById('roleSelect').value = user.role;
                document.getElementById('passwordHint').style.display = 'block';
                document.getElementById('passwordInput').required = false;
                currentUserType = user.type;
                
                // Disable role selection if coach editing admin/coach
                if (!isAdmin && user.role !== 'user') {
                    document.getElementById('roleSelect').disabled = true;
                } else {
                    document.getElementById('roleSelect').disabled = false;
                }
            }
        })
        .catch(error => {
            console.error('Error loading user:', error);
            showError('Failed to load user');
        });
}

let currentUserType = null;

function saveUser() {
    const username = document.getElementById('usernameInput').value;
    const password = document.getElementById('passwordInput').value;
    const role = document.getElementById('roleSelect').value;
    const first_name = document.getElementById('firstNameInput').value;
    const last_name = document.getElementById('lastNameInput').value;
    
    // Coaches can only create/edit users
    if (!isAdmin && role !== 'user') {
        showError('Coaches can only create and edit user accounts');
        return;
    }
    
    const userData = {
        username: username,
        role: role,
        first_name: first_name,
        last_name: last_name
    };
    
    if (password) {
        userData.password = password;
    }
    
    if (currentUserId) {
        // Update existing user
        userData.type = currentUserType;
        
        fetch(`/api/users/${currentUserId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showError(data.error);
            } else {
                closeUserEditor();
                loadUsers();
            }
        })
        .catch(error => {
            console.error('Error updating user:', error);
            showError('Failed to update user');
        });
    } else {
        // Create new user
        if (!password) {
            showError('Password is required for new users');
            return;
        }
        
        fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showError(data.error);
            } else {
                closeUserEditor();
                loadUsers();
            }
        })
        .catch(error => {
            console.error('Error creating user:', error);
            showError('Failed to create user');
        });
    }
}

function editUser(userId, userType) {
    currentUserType = userType;
    openUserEditor(userId);
}

function deleteUser(userId, userType) {
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }
    
    fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: userType })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            loadUsers();
        }
    })
    .catch(error => {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
    });
}

function showError(message) {
    const errorDiv = document.getElementById('editorError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

