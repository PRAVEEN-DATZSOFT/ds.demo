const API_BASE = 'http://localhost:8080/api';

// Config for auth bearer
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

function showToast(message, isError = false) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `p-3 rounded shadow-md text-white text-sm transform transition-all duration-300 translate-y-10 opacity-0 ${isError ? 'bg-red-500' : 'bg-green-500'}`;
    toast.innerText = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
    }, 10);
    
    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Global Error Handler for fetch
async function apiFetch(endpoint, options = {}) {
    options.headers = getAuthHeaders();
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
        return;
    }
    
    if(!response.ok) throw new Error('API Request Failed');
    
    try {
        return await response.json();
    } catch {
        return response; // Sometimes response is empty (e.g., mark as read)
    }
}

// LOGIN LOGIC
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errObj = document.getElementById('errorMsg');
        
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) throw new Error('Invalid Credentials');
            
            const data = await res.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = 'dashboard.html';
        } catch (error) {
            errObj.innerText = error.message;
            errObj.classList.remove('hidden');
        }
    });
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// DASHBOARD LOGIC
async function initDashboard() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = 'index.html';
        return;
    }
    
    const user = JSON.parse(userStr);
    document.getElementById('userNameDisplay').innerText = `Welcome, ${user.name}`;
    
    if (user.internal) {
        document.getElementById('uploadBtn').classList.remove('hidden');
    }

    await loadMediaGrid();
    await checkNotifications();
    setInterval(checkNotifications, 10000); // Poll every 10s

    document.getElementById('bellBtn').addEventListener('click', () => {
        document.getElementById('notifDropdown').classList.toggle('hidden');
    });
}

function renderMediaCard(item) {
    const isExpired = item.endDate && new Date(item.endDate) <= new Date();
    const statusHtml = isExpired 
        ? `<span class="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Expired</span>`
        : `<span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Active</span>`;

    return `
        <div class="bg-white p-4 rounded shadow ${isExpired ? 'opacity-70' : ''}">
            <div class="flex justify-between items-start mb-2">
                <h3 class="font-bold truncate text-lg">${item.title}</h3>
                ${statusHtml}
            </div>
            <p class="text-sm text-gray-600 truncate">${item.description || 'No description'}</p>
            <div class="mt-4"><a href="media-details.html?id=${item.id}" class="text-blue-600 hover:underline text-sm font-semibold">View Details</a></div>
        </div>
    `;
}

async function loadMediaGrid() {
    try {
        const media = await apiFetch('/media');
        document.getElementById('mediaGrid').innerHTML = media.map(renderMediaCard).join('');
    } catch {
        showToast('Error loading media', true);
    }
}

// NOTIFICATIONS LOGIC
let notifications = [];
async function checkNotifications() {
    try {
        notifications = await apiFetch('/notifications');
        const unread = notifications.filter(n => !n.read).length;
        
        const badge = document.getElementById('notifBadge');
        if (unread > 0) {
            badge.innerText = unread;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }

        const listDiv = document.getElementById('notifList');
        if(notifications.length === 0) {
            listDiv.innerHTML = '<p class="p-3 text-gray-500 text-sm">No notifications</p>';
            return;
        }

        listDiv.innerHTML = notifications.map(n => `
            <div class="p-3 border-b cursor-pointer ${n.read ? 'bg-white' : 'bg-blue-50'}" onclick="markNotificationRead(${n.id})">
                <p class="font-bold text-sm">${n.title}</p>
                <p class="text-sm text-gray-700">${n.message}</p>
            </div>
        `).join('');
    } catch {}
}

async function markNotificationRead(id) {
    try {
        await apiFetch(`/notifications/${id}/read`, { method: 'POST' });
        checkNotifications(); // reload
    } catch {}
}

async function markAllNotificationsRead() {
    try {
        // Assume endpoint or map promises. We will map promises.
        const unread = notifications.filter(n => !n.read);
        await Promise.all(unread.map(n => apiFetch(`/notifications/${n.id}/read`, { method: 'POST' })));
        checkNotifications();
    } catch {}
}

// MEDIA DETAILS LOGIC
async function loadMediaDetails(id) {
    try {
        const [media, comments] = await Promise.all([
            apiFetch(`/media`), // Normally a backend /media/{id} exists, filtering here for brevity
            apiFetch(`/media/${id}/comments`)
        ]);
        
        const item = media.find(m => m.id == id);
        if(!item) throw new Error("Media not found");

        const isExpired = item.endDate && new Date(item.endDate) <= new Date();
        document.getElementById('mediaTitle').innerText = item.title;
        document.getElementById('mediaDesc').innerText = item.description;
        
        const statusSpan = document.getElementById('mediaStatus');
        statusSpan.innerText = isExpired ? 'Expired' : 'Active';
        statusSpan.className = isExpired ? 'px-3 py-1 bg-red-100 text-red-800 rounded text-xs font-bold' : 'px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-bold';

        const viewer = document.getElementById('mediaViewer');
        if (item.fileType === 'image') {
            viewer.innerHTML = `<img src="${item.filePath}" class="max-h-80 object-contain" onerror="this.src='https://via.placeholder.com/600'" />`;
        } else {
            viewer.innerHTML = `<p class="text-gray-500">[Video Playback Stub]</p>`;
        }

        renderComments(comments);
    } catch (e) {
        showToast('Failed to load details', true);
    }
}

function renderComments(comments) {
    const list = document.getElementById('commentsList');
    if (comments.length === 0) {
        list.innerHTML = '<p class="text-gray-500 text-sm">No comments yet.</p>';
        return;
    }
    list.innerHTML = comments.map(c => `
        <div class="bg-gray-50 p-2 rounded relative">
            <p class="font-bold text-xs">${c.user?.name || 'User'}</p>
            <p class="text-sm">${c.content}</p>
        </div>
    `).join('');
}

async function handleCommentSubmit(e, mediaId) {
    e.preventDefault();
    const content = document.getElementById('commentInput').value;
    try {
        await apiFetch(`/media/${mediaId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ comment: content })
        });
        document.getElementById('commentInput').value = '';
        showToast('Comment posted successfully!');
        loadMediaDetails(mediaId); // reload
    } catch {
        showToast('Failed to post comment', true);
    }
}

// MEDIA UPLOAD LOGIC
async function handleUpload(e) {
    e.preventDefault();
    const request = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        file_path: document.getElementById('file_path').value,
        file_type: document.getElementById('file_type').value,
        company_id: document.getElementById('company_id').value,
        end_date: document.getElementById('end_date').value || null
    };

    try {
        await apiFetch('/media', {
            method: 'POST',
            body: JSON.stringify(request)
        });
        showToast('Media assigned to company successfully!');
        setTimeout(() => window.location.href='dashboard.html', 1500);
    } catch {
        showToast('Failed to upload media', true);
    }
}
