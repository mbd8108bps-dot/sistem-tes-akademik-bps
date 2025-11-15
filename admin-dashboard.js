// admin-dashboard.js
import { supabase } from './supabase-config.js';

// Check if admin is logged in
function checkAdminSession() {
    const session = sessionStorage.getItem('adminSession');
    if (!session) {
        window.location.href = 'admin-login.html';
        return false;
    }
    return true;
}

// Load dashboard data
async function loadDashboard() {
    try {
        // 1. Get total peserta dari invitation_codes
        const { data: allCodes, error: codesError } = await supabase
            .from('invitation_codes')
            .select('id, is_used');

        if (codesError) throw codesError;

        // 2. Get test sessions
        const { data: sessions, error: sessionsError } = await supabase
            .from('test_sessions')
            .select('*')
            .order('score', { ascending: false });

        if (sessionsError) throw sessionsError;

        // 3. Calculate stats
        const totalParticipants = allCodes ? allCodes.length : 0;
        const alreadyUsed = allCodes ? allCodes.filter(c => c.is_used === true).length : 0;
        const incompleteTests = totalParticipants - alreadyUsed;

        const completedSessions = sessions.filter(s => s.status === 'completed');
        const averageScore = completedSessions.length > 0 
            ? Math.round(completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions.length)
            : 0;

        // 4. Update UI
        document.getElementById('totalParticipants').textContent = totalParticipants;
        document.getElementById('completedTests').textContent = alreadyUsed;
        document.getElementById('incompleteTests').textContent = incompleteTests;
        document.getElementById('averageScore').textContent = averageScore + '%';

        // 5. Display data
        displayPodium(sessions.slice(0, 3));
        displayLeaderboard(sessions.slice(0, 10));
        displayParticipants(sessions);

    } catch (error) {
        console.error('Dashboard Error:', error);
    }
}

// Display Top 3 Podium
function displayPodium(topThree) {
    const container = document.getElementById('podiumContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!topThree || topThree.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">Belum ada data</p>';
        return;
    }

    topThree.forEach((session, index) => {
        const medals = ['🥇', '🥈', '🥉'];
        const colors = ['#FFD700', '#C0C0C0', '#CD7F32'];

        const card = document.createElement('div');
        card.style.textAlign = 'center';
        card.style.padding = '20px';
        card.style.background = '#f9fafb';
        card.style.borderRadius = '12px';
        card.style.borderLeft = '4px solid ' + colors[index];

        const medal = medals[index] || '';
        const score = session.score || 0;
        const name = session.participant_name || 'N/A';

        card.innerHTML = medal + '<br><br>'
            + '<div style="font-size: 18px; font-weight: bold;">' + name + '</div>'
            + '<div style="font-size: 28px; font-weight: bold; color:' + colors[index] + '; margin-top: 10px;">' + score + '%</div>';

        container.appendChild(card);
    });
}

// Display Top 10 Leaderboard
function displayLeaderboard(topTen) {
    const tbody = document.getElementById('leaderboardTable');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!topTen || topTen.length === 0) {
        const row = tbody.insertRow();
        row.innerHTML = '<td colspan="6" style="text-align: center; color: #999;">Belum ada data</td>';
        return;
    }

    topTen.forEach((session, index) => {
        const row = tbody.insertRow();

        const rank = index + 1;
        const name = session.participant_name || 'N/A';
        const score = session.score || 0;
        const total = session.total_questions || 0;
        const correct = Math.round((score / 100) * total);
        const startTime = new Date(session.start_time).toLocaleString('id-ID');
        const duration = session.duration_seconds ? Math.round(session.duration_seconds / 60) : 0;

        row.innerHTML = '<td>#' + rank + '</td>'
            + '<td>' + name + '</td>'
            + '<td>' + score + '%</td>'
            + '<td>' + correct + '/' + total + '</td>'
            + '<td>' + startTime + '</td>'
            + '<td>' + duration + ' menit</td>';
    });
}

// Display Participants
function displayParticipants(sessions) {
    const tbody = document.getElementById('participantsTable');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!sessions || sessions.length === 0) {
        const row = tbody.insertRow();
        row.innerHTML = '<td colspan="8" style="text-align: center; color: #999;">Belum ada data</td>';
        return;
    }

    sessions.forEach(session => {
        const row = tbody.insertRow();

        const code = session.invitation_code || '-';
        const name = session.participant_name || '-';
        const status = session.status === 'completed' ? 'Selesai' : 'Belum Selesai';
        const score = session.score || '-';
        const startTime = session.start_time ? new Date(session.start_time).toLocaleString('id-ID') : '-';
        const endTime = session.end_time ? new Date(session.end_time).toLocaleString('id-ID') : '-';
        const duration = session.duration_seconds ? Math.round(session.duration_seconds / 60) + ' menit' : '-';

        row.innerHTML = '<td>' + code + '</td>'
            + '<td>' + name + '</td>'
            + '<td>' + status + '</td>'
            + '<td>' + score + '%</td>'
            + '<td>' + startTime + '</td>'
            + '<td>' + endTime + '</td>'
            + '<td>' + duration + '</td>'
            + '<td><button style="padding: 6px 12px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">Detail</button></td>';
    });
}

// Logout
window.logout = function() {
    sessionStorage.removeItem('adminSession');
    window.location.href = 'admin-login.html';
};

// Export Data
window.exportData = async function() {
    try {
        const { data, error } = await supabase
            .from('test_sessions')
            .select('*');

        if (error) throw error;

        let csv = 'Kode,Nama,Status,Skor,Mulai,Selesai,Durasi\n';

        data.forEach(row => {
            csv += (row.invitation_code || '-') + ','
                + (row.participant_name || '-') + ','
                + (row.status || '-') + ','
                + (row.score || '-') + ','
                + (row.start_time || '-') + ','
                + (row.end_time || '-') + ','
                + (row.duration_seconds || '-') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hasil-tes-' + new Date().toDateString() + '.csv';
        a.click();
        window.URL.revokeObjectURL(url);

        alert('Export berhasil!');
    } catch (error) {
        alert('Export gagal: ' + error.message);
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    if (checkAdminSession()) {
        loadDashboard();
    }
});
