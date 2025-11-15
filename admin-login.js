// admin-login.js
import { supabase } from './supabase-config.js';

const form = document.getElementById('adminLoginForm');
const alertContainer = document.getElementById('alertContainer');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;

    console.log('Login attempt - Email:', email, 'Password:', password);

    try {
        // Check admin credentials from database
        const { data, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', email)
            .single();

        console.log('Query result:', data, error);

        if (error) {
            console.error('Query error:', error);
            showAlert('Email atau password salah!', 'error');
            return;
        }

        if (!data) {
            showAlert('Email atau password salah!', 'error');
            return;
        }

        console.log('User data:', data);
        console.log('Password hash:', data.password_hash);

        // Simple string comparison for password
        if (data.password_hash !== password) {
            console.log('Password mismatch. Expected:', data.password_hash, 'Got:', password);
            showAlert('Email atau password salah!', 'error');
            return;
        }

        // Store admin session
        const sessionData = {
            id: data.id,
            email: data.email,
            fullName: data.full_name,
            role: data.role
        };

        sessionStorage.setItem('adminSession', JSON.stringify(sessionData));

        console.log('Login successful!');
        showAlert('Login berhasil! Mengarahkan ke dashboard...', 'success');

        setTimeout(() => {
            window.location.href = 'admin-dashboard.html';
        }, 1000);

    } catch (error) {
        console.error('Login error:', error);
        showAlert('Terjadi kesalahan: ' + error.message, 'error');
    }
});

function showAlert(message, type) {
    alertContainer.innerHTML = '<div class="alert alert-' + type + '">' + message + '</div>';
    console.log('Alert:', type, message);
}
