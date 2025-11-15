// test-portal.js
import { supabase } from './supabase-config.js';

const form = document.getElementById('accessForm');
const alertContainer = document.getElementById('alertContainer');
const btnText = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const invitationCode = document.getElementById('invitationCode').value.trim().toUpperCase();
    const participantName = document.getElementById('participantName').value.trim();

    // Show loading state
    btnText.textContent = 'Memverifikasi...';
    btnSpinner.classList.remove('hidden');

    try {
        // Check if invitation code exists and is not used
        const { data: codeData, error: codeError } = await supabase
            .from('invitation_codes')
            .select('*')
            .eq('code', invitationCode)
            .single();

        if (codeError || !codeData) {
            showAlert('Kode undangan tidak valid!', 'error');
            resetButton();
            return;
        }

        if (codeData.is_used) {
            showAlert('Kode undangan sudah digunakan!', 'error');
            resetButton();
            return;
        }

        // Mark code as used
        const { error: updateError } = await supabase
            .from('invitation_codes')
            .update({ 
                is_used: true, 
                used_at: new Date().toISOString(),
                participant_name: participantName 
            })
            .eq('code', invitationCode);

        if (updateError) {
            showAlert('Terjadi kesalahan. Silakan coba lagi.', 'error');
            resetButton();
            return;
        }

        // Create test session
        const { data: sessionData, error: sessionError } = await supabase
            .from('test_sessions')
            .insert([{
                invitation_code: invitationCode,
                participant_name: participantName,
                status: 'in_progress'
            }])
            .select()
            .single();

        if (sessionError) {
            showAlert('Gagal membuat sesi tes. Silakan coba lagi.', 'error');
            resetButton();
            return;
        }

        // Store session info in sessionStorage
        sessionStorage.setItem('testSession', JSON.stringify({
            sessionId: sessionData.id,
            invitationCode: invitationCode,
            participantName: participantName,
            startTime: new Date().toISOString()
        }));

        // Redirect to test interface
        showAlert('Verifikasi berhasil! Mengarahkan ke tes...', 'success');
        setTimeout(() => {
            window.location.href = 'test-interface.html';
        }, 1500);

    } catch (error) {
        console.error('Error:', error);
        showAlert('Terjadi kesalahan. Silakan coba lagi.', 'error');
        resetButton();
    }
});

function showAlert(message, type) {
    alertContainer.innerHTML = `
        <div class="alert alert-${type}">
            ${message}
        </div>
    `;
}

function resetButton() {
    btnText.textContent = 'Mulai Tes';
    btnSpinner.classList.add('hidden');
}
