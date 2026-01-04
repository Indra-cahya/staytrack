import { apiRequest } from './api.js';
import { checkAuth } from './auth.js';

let rooms = [];
let currentEditTenantId = null; 

document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.pathname.endsWith('tenants.html')) return;

    loadTenants();
    loadRoomsForSelect();
    setupSidebarNavigation();

    // 1. Inisialisasi Tombol Utama
    const btnAddTenant = document.getElementById('btnAddTenant');
    const btnSaveTenant = document.getElementById('btnSaveTenant');
    const btnCancelTenant = document.getElementById('btnCancelTenant');
    const paymentMethodSelect = document.getElementById('paymentMethod');

    if (btnAddTenant) btnAddTenant.onclick = showAddTenantForm;
    if (btnSaveTenant) btnSaveTenant.onclick = saveTenant;
    if (btnCancelTenant) btnCancelTenant.onclick = hideAddTenantForm;
    if (paymentMethodSelect) paymentMethodSelect.onchange = handlePaymentMethodChange;
});

// --- FUNGSI TAMPILAN (UI) ---

function showAddTenantForm() {
    currentEditTenantId = null; // Reset ke mode TAMBAH
    resetTenantForm();
    
    // UI Normal Tambah
    updateModalUI('Tambah Penyewa Baru', 'block');
    document.getElementById('addTenantForm').style.display = 'flex';
}

async function editTenant(id) {
    try {
        const response = await apiRequest(`/api/admin/tenants/${id}`);
        const tenant = response.data || response;

        if (!tenant) throw new Error('Data penyewa tidak ditemukan');

        currentEditTenantId = id; // Set ke mode EDIT
        resetTenantForm();

        // Isi Data
        document.getElementById('tenantName').value = tenant.name || '';
        document.getElementById('phone').value = tenant.phone || '';
        document.getElementById('idNumber').value = tenant.idNumber || '';
        document.getElementById('paymentMethod').value = tenant.preferredPaymentMethod || '';

        // UI Khusus Edit (Sembunyikan Kamar)
        updateModalUI('Edit Profil Penyewa', 'none');
        
        if (tenant.preferredPaymentMethod === 'qr') displayStaticQRIS();
        
        document.getElementById('addTenantForm').style.display = 'flex';

    } catch (error) {
        alert('Gagal memuat data: ' + error.message);
    }
}

function updateModalUI(titleText, roomDisplay) {
    const title = document.querySelector('#addTenantForm h3');
    const roomGroup = document.getElementById('roomIdGroup');
    
    if (title) title.textContent = titleText;
    if (roomGroup) roomGroup.style.display = roomDisplay;
}

function resetTenantForm() {
    const fields = ['tenantName', 'phone', 'idNumber', 'roomId', 'paymentMethod'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('qrisSection').style.display = 'none';
    document.getElementById('qrisContainer').innerHTML = '';
}

function hideAddTenantForm() {
    document.getElementById('addTenantForm').style.display = 'none';
    currentEditTenantId = null;
}

// --- FUNGSI LOGIKA DATA (API) ---

async function saveTenant() {
    const name = document.getElementById('tenantName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const idNumber = document.getElementById('idNumber').value.trim();
    const paymentMethod = document.getElementById('paymentMethod').value;

    if (!name || !phone || !idNumber || !paymentMethod) {
        return alert('Field utama wajib diisi!');
    }

    const payload = { name, phone, idNumber, paymentMethod };

    if (!currentEditTenantId) {
        const roomId = document.getElementById('roomId').value;
        if (!roomId) return alert('Pilih kamar dulu Bos!');
        payload.roomId = roomId;
    }

    try {
        const url = currentEditTenantId ? `/api/admin/tenants/${currentEditTenantId}` : '/api/admin/tenants/create';
        const method = currentEditTenantId ? 'PUT' : 'POST';

        await apiRequest(url, method, payload);

        // --- FIX: TUTUP MODAL DULU ---
        hideAddTenantForm(); 

        // --- BARU MUNCULIN NOTIF CENTANG ---
        await Swal.fire({
            title: 'Berhasil!',
            text: `Data penyewa berhasil ${currentEditTenantId ? 'diperbarui' : 'ditambahkan'}`,
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            timerProgressBar: true
        });

        loadTenants();
        loadRoomsForSelect();

    } catch (error) {
        Swal.fire({
            title: 'Gagal!',
            text: error.message || 'Terjadi kesalahan saat menyimpan',
            icon: 'error',
            confirmButtonColor: '#4f46e5'
        });
    }
}

async function loadTenants() {
    try {
        const response = await apiRequest('/api/admin/tenants');
        const tenants = response.data || response;
        const container = document.getElementById('tenantsList');
        const countSpan = document.getElementById('tenantCount');

        if (!container) return;
        container.innerHTML = '';
        
        if (!Array.isArray(tenants)) return countSpan.textContent = '0 penyewa';
        countSpan.textContent = `${tenants.length} penyewa`;

        tenants.forEach(tenant => {
            const roomNum = (tenant.roomId && tenant.roomId.roomNumber) ? tenant.roomId.roomNumber : '-';
            const roomType = (tenant.roomId && tenant.roomId.type) ? tenant.roomId.type : 'Standard';
            
            const div = document.createElement('div');
div.className = 'list-item';
div.innerHTML = `
    <div style="padding: 15px; border-bottom: 1px solid #f1f5f9;">
        <strong style="font-size: 1.1rem; color: #1e293b;">${tenant.name}</strong><br>
        <div style="margin-top: 5px; color: #64748b; font-size: 0.9rem;">
            <span><i class="fas fa-phone"></i> HP: ${tenant.phone}</span><br>
            <span><i class="fas fa-id-card"></i> KTP: ${tenant.idNumber}</span><br>
            <span style="display: inline-block; margin-top: 5px; padding: 2px 8px; background: #eff6ff; color: #1d4ed8; border-radius: 4px; font-weight: 600;">
                <i class="fas fa-door-open"></i> Kamar ${roomNum} (${roomType})
            </span>
        </div>
    </div>
    <div class="list-actions" style="padding: 10px; display: flex; gap: 8px;">
        <button class="edit">Edit</button>
        <button class="delete">Checkout</button>
    </div>
`;
container.appendChild(div);

// JANGAN LUPA UPDATE SELECTOR NYA JUGA
div.querySelector('.edit').onclick = () => editTenant(tenant._id);
div.querySelector('.delete').onclick = () => checkoutTenant(tenant._id);
        });
    } catch (error) {
        console.error('Error load tenants:', error);
    }
}

// --- FUNGSI HELPER LAIN ---

function handlePaymentMethodChange() {
    const method = document.getElementById('paymentMethod').value;
    const qrisSection = document.getElementById('qrisSection');
    if (method === 'qr') {
        qrisSection.style.display = 'block';
        displayStaticQRIS();
    } else {
        qrisSection.style.display = 'none';
    }
}

function displayStaticQRIS() {
    const container = document.getElementById('qrisContainer');
    if (container) {
        container.innerHTML = `
            <div style="margin-top: 10px; padding: 10px; background: white; border: 2px dashed #cbd5e1; border-radius: 12px; text-align: center;">
                <img src="images/qris-static.png" style="max-width: 180px; height: auto;">
                <p style="font-size: 11px; color: #64748b; margin-top: 5px;">Silakan scan pembayaran</p>
            </div>
        `;
    }
}

async function loadRoomsForSelect() {
    try {
        const response = await apiRequest('/api/admin/rooms');
        const availableRooms = (Array.isArray(response) ? response : (response.data || [])).filter(r => r.status === 'available');
        const select = document.getElementById('roomId');
        if (!select) return;

        select.innerHTML = '<option value="">Pilih Kamar</option>';
        availableRooms.forEach(room => {
            const opt = document.createElement('option');
            opt.value = room._id;
            opt.textContent = `Kamar ${room.roomNumber} (${room.type || 'Standard'})`;
            select.appendChild(opt);
        });
    } catch (error) { console.error(error); }
}

function setupSidebarNavigation() {
    document.querySelectorAll('.sidebar-menu li').forEach(item => {
        if (item.textContent.trim().includes('Penyewa')) item.classList.add('active');
    });
}

async function checkoutTenant(id) {
    // 1. Munculin Pop-up Konfirmasi
    const result = await Swal.fire({
        title: 'Konfirmasi Checkout',
        text: "Penyewa akan dikeluarkan dan status kamar akan kembali tersedia.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#4f46e5', // Warna ungu StayTrack
        cancelButtonColor: '#f87171', // Warna merah
        confirmButtonText: 'Ya, Checkout!',
        cancelButtonText: 'Batal',
        reverseButtons: true
    });

    // 2. Kalau User Klik "Ya"
    if (result.isConfirmed) {
        try {
            await apiRequest(`/api/admin/tenants/checkout/${id}`, 'PUT');

            // Notifikasi Sukses
            await Swal.fire({
                title: 'Berhasil!',
                text: 'Penyewa telah berhasil di-checkout.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                timerProgressBar: true
            });

            // Refresh data biar list penyewa & statistik diupdate
            loadTenants();
            if (typeof loadRoomsForSelect === 'function') loadRoomsForSelect();

        } catch (error) {
            Swal.fire({
                title: 'Gagal!',
                text: error.message || 'Gagal melakukan checkout',
                icon: 'error',
                confirmButtonColor: '#4f46e5'
            });
        }
    }
}