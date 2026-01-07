import { apiRequest } from './api.js';
import { checkAuth } from './auth.js';

let currentEditingRoomId = null;
let allRooms = []; 

document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.pathname.endsWith('rooms.html')) return;

    loadRooms();
    setupSidebarNavigation();

    const headerBtn = document.getElementById('showAddRoom'); 
    const btnSaveRoom = document.getElementById('btnSaveRoom');
    const btnCancelRoom = document.getElementById('btnCancelRoom');

    if (headerBtn) {
        headerBtn.addEventListener('click', () => {
            currentEditingRoomId = null; 
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
    
    // Reset form ke kosong
    document.getElementById('roomNumber').value = '';
    if(document.getElementById('priceMonthly')) document.getElementById('priceMonthly').value = '';
    if(document.getElementById('priceDaily')) document.getElementById('priceDaily').value = '';
    
    document.getElementById('type').value = '';
    document.getElementById('capacity').value = '';
    document.getElementById('facilities').value = '';
}

function hideAddRoomForm() {
    document.getElementById('addRoomForm').style.display = 'none';
    currentEditingRoomId = null;
}

async function saveRoom() {
    const roomNumber = document.getElementById('roomNumber').value.trim();
    const priceMonthly = parseFloat(document.getElementById('priceMonthly').value);
    const priceDaily = parseFloat(document.getElementById('priceDaily').value);
    const type = document.getElementById('type').value;
    const capacity = parseInt(document.getElementById('capacity').value);
    const facilitiesInput = document.getElementById('facilities').value.trim();
    const facilitiesArray = facilitiesInput ? facilitiesInput.split(',').map(f => f.trim()) : [];
    if (!roomNumber || isNaN(priceMonthly) || isNaN(priceDaily) || !type || isNaN(capacity) || !facilities) {
        return Swal.fire({
            title: 'Waduh!',
            text: 'Semua harga (Bulanan & Harian) serta data lainnya wajib diisi ya Bos!',
            icon: 'warning'
        });
    }

    const data = { 
        roomNumber, 
        priceMonthly, 
        priceDaily, 
        price: priceMonthly, 
        type, 
        capacity, 
        facilities: facilitiesArray
    };

    try {
        let message = "";
        if (currentEditingRoomId) {
            await apiRequest(`/api/admin/rooms/${currentEditingRoomId}`, 'PUT', data);
            message = 'Kamar berhasil diperbarui!';
        } else {
            await apiRequest('/api/admin/rooms/create', 'POST', data);
            message = 'Kamar berhasil ditambahkan!';
        }

        hideAddRoomForm();

        await Swal.fire({
            title: 'Berhasil!',
            text: message,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            timerProgressBar: true
        });

        loadRooms(); 

    } catch (error) {
        Swal.fire({
            title: 'Gagal!',
            text: error.message || 'Terjadi kesalahan sistem',
            icon: 'error',
            confirmButtonColor: '#ef4444'
        });
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
            countSpan.textContent = '0 kamar';
            return;
        }

        countSpan.textContent = `${allRooms.length} kamar`;

        allRooms.forEach(room => {
            const statusText = room.status === 'available' ? 'Tersedia' : 'Ditempati';
            const statusColor = room.status === 'available' ? '#27ae60' : '#e74c3c';
            const fasilitasTampil = Array.isArray(room.facilities) 
        ? room.facilities.join(', ') 
        : (room.facilities || '—');
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `
                <div style="padding: 15px; border-bottom: 1px solid #eee; flex-grow: 1;">
                    <strong>Kamar ${room.roomNumber}</strong> (${room.type})<br>
                    <div style="margin-top: 5px;">
                        <span style="color: #4f46e5; font-weight: bold;">
                            Bulanan: Rp ${(room.priceMonthly || 0).toLocaleString('id-ID')}
                        </span>
                        <br>
                        <span style="color: #10b981; font-weight: bold;">
                            Harian: Rp ${(room.priceDaily || 0).toLocaleString('id-ID')}
                        </span>
                    </div>
                    <small>Fasilitas: <span style="color: #64748b;">${fasilitasTampil}</span></small><br>
                    <small>Kapasitas: ${room.capacity} orang</small><br>
                    <small>Status: <span style="color:${statusColor}">${statusText}</span></small>
                </div>
                <div class="list-actions" style="padding: 10px; display: flex; gap: 5px;">
                    <button class="edit-btn" style="background: #f1f5f9; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Edit</button>
                    <button class="delete-btn" style="background: #fee2e2; color: #ef4444; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Hapus</button>
                </div>
            `;
            container.appendChild(div);

            div.querySelector('.edit-btn').onclick = () => editRoom(room._id);
            div.querySelector('.delete-btn').onclick = () => deleteRoom(room._id);
        });

    } catch (error) {
        console.error('Gagal memuat kamar:', error);
    }
}

function editRoom(id) {
    const room = allRooms.find(r => r._id === id);
    if (!room) return Swal.fire('Error', 'Kamar tidak ditemukan', 'error');

    currentEditingRoomId = id;

    document.getElementById('roomNumber').value = room.roomNumber || '';
    document.getElementById('priceMonthly').value = room.priceMonthly || room.price || 0;
    document.getElementById('priceDaily').value = room.priceDaily || 0;
    document.getElementById('type').value = room.type || '';
    document.getElementById('capacity').value = room.capacity || '';
    document.getElementById('facilities').value = room.facilities || '';

    document.getElementById('formTitle').textContent = 'Edit Kamar ' + room.roomNumber;
    document.getElementById('addRoomForm').style.display = 'flex';
}

async function deleteRoom(id) {
    const result = await Swal.fire({
        title: 'Apakah Anda yakin?',
        text: "Data kamar yang dihapus tidak bisa dikembalikan!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#4f46e5',
        cancelButtonColor: '#ef4444',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal',
        reverseButtons: true
    });

    if (result.isConfirmed) {
        try {
            await apiRequest(`/api/admin/rooms/${id}`, 'DELETE');
            await Swal.fire({ title: 'Terhapus!', text: 'Kamar berhasil dihapus.', icon: 'success', timer: 1500, showConfirmButton: false });
            loadRooms(); 
        } catch (error) {
            Swal.fire('Gagal!', error.message, 'error');
        }
    }
}