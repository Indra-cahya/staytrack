import { apiRequest } from './api.js'; 
import { checkAuth } from './auth.js';

// Fungsi untuk menampilkan skeleton
function showSkeleton() {
    document.querySelectorAll('.content-loading').forEach(el => {
        el.style.display = 'block';
    });
    document.querySelectorAll('.card-value').forEach(el => {
        el.style.display = 'none';
    });
}

// Fungsi untuk menyembunyikan skeleton dan menampilkan data
function hideSkeletonAndShowData() {
    document.querySelectorAll('.content-loading').forEach(el => {
        el.style.display = 'none';
    });
    document.querySelectorAll('.card-value').forEach(el => {
        el.style.display = 'block';
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    try {
        console.log('Fetching dashboard data...');

        // 1. LOGIC OTOMATIS TANGGAL BULAN INI
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        // 2. PANGGIL API REPORTS DENGAN FILTER (suoaya angka sinkron)
        const reportResult = await apiRequest(`/api/admin/reports?startDate=${startOfMonth}&endDate=${endOfMonth}`, 'GET');

        // Ambil data kamar & tenant (tetap keseluruhan)
        const roomsResult = await apiRequest('/api/admin/rooms', 'GET');
        const tenantsResult = await apiRequest('/api/admin/tenants', 'GET');

        if (reportResult.success && reportResult.data) {
            // Isi Pemasukan Bulan Ini (Udah ke-filter di URL tadi)
            const totalIncome = reportResult.data.totalIncome || 0;

            const rooms = Array.isArray(roomsResult) ? roomsResult : (roomsResult.data || []);
            const occupied = rooms.filter(r => r.status === 'occupied').length;
            const vacant = rooms.length - occupied;

            const tenants = Array.isArray(tenantsResult) ? tenantsResult : (tenantsResult.data || []);

            // Tampilkan ke Dashboard
            document.getElementById('monthlyIncome').textContent = `Rp ${totalIncome.toLocaleString('id-ID')}`;
            document.getElementById('occupiedRooms').textContent = occupied;
            document.getElementById('vacantRooms').textContent = vacant;
            document.getElementById('totalTenants').textContent = tenants.length;

        } else {
            console.error('Gagal memuat data:', reportResult.message);
        }
    } catch (error) {
        console.error('Crash saat memuat dashboard:', error);
    }
});