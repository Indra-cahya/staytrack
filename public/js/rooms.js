import { apiRequest } from './api.js';
import { checkAuth } from './auth.js';

let currentEditingRoomId = null;
let allRooms = []; // Simpan data kamar untuk edit

document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.pathname.endsWith('rooms.html')) return;

    loadRooms();
    setupSidebarNavigation();

    // SETUP TOMBOL YANG BENER:
    const headerBtn = document.getElementById('showAddRoom'); // Pakai ID tombol kamu
    const btnSaveRoom = document.getElementById('btnSaveRoom');
    const btnCancelRoom = document.getElementById('btnCancelRoom');

    if (headerBtn) {
        headerBtn.addEventListener('click', () => {
            currentEditingRoomId = null; // Pastikan reset ID saat mau tambah baru
            showAddRoomForm();
        });
    }
    
    if (btnSaveRoom) btnSaveRoom.addEventListener('click', saveRoom);
    if (btnCancelRoom) btnCancelRoom.addEventListener('click', hideAddRoomForm);
});

function setupSidebarNavigation() {
    const menuItems = document.querySelectorAll('.sidebar-menu li');
    menuItems.forEach(item => {
        if (item.textContent.trim().includes('Kamar')) {
            item.classList.add('active');
        }
    });
}

function showAddRoomForm() {
    const modal = document.getElementById('addRoomForm');
    modal.style.display = 'flex';
    document.getElementById('formTitle').textContent = currentEditingRoomId ? 'Edit Kamar' : 'Tambah Kamar Baru';
    
    // Reset form
    document.getElementById('roomNumber').value = '';
    document.getElementById('price').value = '';
    document.getElementById('type').value = '';
    document.getElementById('capacity').value = '';
    document.getElementById('facilities').value = '';
    currentEditingRoomId = null;
}

function hideAddRoomForm() {
    document.getElementById('addRoomForm').style.display = 'none';
}

// Fungsi baru: simpan (create atau update)
async function saveRoom() {
    const roomNumber = document.getElementById('roomNumber').value.trim();
    const price = parseFloat(document.getElementById('price').value);
    const type = document.getElementById('type').value;
    const capacity = parseInt(document.getElementById('capacity').value);
    const facilities = document.getElementById('facilities').value.trim();

    if (!roomNumber || isNaN(price) || !type || isNaN(capacity) || !facilities) {
        alert('Semua field harus diisi dengan benar!');
        return;
    }

    const data = { roomNumber, price, type, capacity, facilities };

    try {
        if (currentEditingRoomId) {
            // Update
            await apiRequest(`/api/admin/rooms/${currentEditingRoomId}`, 'PUT', data);
            alert('Kamar berhasil diperbarui!');
        } else {
            // Create
            await apiRequest('/api/admin/rooms/create', 'POST', data);
            alert('Kamar berhasil ditambahkan!');
        }

        hideAddRoomForm();
        loadRooms();

    } catch (error) {
        alert('Gagal menyimpan kamar: ' + error.message);
    }
}

async function loadRooms() {
    try {
        const response = await apiRequest('/api/admin/rooms', 'GET');
        allRooms = Array.isArray(response) ? response : (response.data || response.rooms || []);

        const container = document.getElementById('roomsList');
        const countSpan = document.getElementById('roomCount');

        if (!container) return;

        container.innerHTML = '';

        if (!Array.isArray(allRooms)) {
            container.innerHTML = '<p style="color:red;">Format data kamar tidak valid.</p>';
            countSpan.textContent = '0 kamar';
            return;
        }

        countSpan.textContent = `${allRooms.length} kamar`;

        if (allRooms.length === 0) {
            container.innerHTML = '<p style="color:#777; text-align:center;">Belum ada kamar terdaftar.</p>';
            return;
        }

        allRooms.forEach(room => {
            const statusText = room.status === 'available' ? 'Tersedia' : 'Ditempati';
            const statusColor = room.status === 'available' ? '#27ae60' : '#e74c3c';
            const tenantName = room.currentTenant ? room.currentTenant.name : '—';

            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `
                <div>
                    <strong>Kamar ${room.roomNumber}</strong> (${room.type})<br>
                    <small>Harga: Rp ${room.price.toLocaleString('id-ID')}</small><br>
                    <small>Kapasitas: ${room.capacity} orang</small><br>
                    <small>Fasilitas: ${room.facilities || '—'}</small><br>
                    <small>Status: <span style="color:${statusColor}">${statusText}</span></small><br>
                    <small>Penyewa: ${tenantName}</small>
                </div>
                <div class="list-actions">
                    <button class="edit">Edit</button>
                    <button class="delete">Hapus</button>
                </div>
            `;
            container.appendChild(div);

            div.querySelector('.edit').addEventListener('click', () => editRoom(room._id));
            div.querySelector('.delete').addEventListener('click', () => deleteRoom(room._id));
        });

    } catch (error) {
        console.error('Gagal memuat kamar:', error);
        document.getElementById('roomsList').innerHTML = '<p style="color:red;">Gagal memuat data kamar.</p>';
    }
}

function editRoom(id) {
    const room = allRooms.find(r => r._id === id);
    if (!room) {
        alert('Kamar tidak ditemukan.');
        return;
    }

    document.getElementById('roomNumber').value = room.roomNumber || '';
    document.getElementById('price').value = room.price || '';
    document.getElementById('type').value = room.type || '';
    document.getElementById('capacity').value = room.capacity || '';
    document.getElementById('facilities').value = room.facilities || '';

    currentEditingRoomId = id;
    document.getElementById('formTitle').textContent = 'Edit Kamar';
    document.getElementById('addRoomForm').style.display = 'flex';
}

async function deleteRoom(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus kamar ini?')) return;

    try {
        await apiRequest(`/api/admin/rooms/${id}`, 'DELETE');
        loadRooms();
        alert('Kamar berhasil dihapus!');
    } catch (error) {
        alert('Gagal menghapus kamar: ' + error.message);
    }
}

