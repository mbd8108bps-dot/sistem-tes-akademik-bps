// test-interface.js
import { supabase } from './supabase-config.js';

// Test configuration
const TEST_DURATION = 60 * 60; // 60 minutes in seconds
const TOTAL_QUESTIONS = 30; // Number of questions per test

let testSession = null;
let questions = [];
let currentQuestionIndex = 0;
let answers = {};
let flaggedQuestions = new Set();
let timeRemaining = TEST_DURATION;
let timerInterval = null;

// Initialize test
async function initTest() {
    // Get session from sessionStorage
    const sessionData = sessionStorage.getItem('testSession');
    if (!sessionData) {
        alert('Sesi tidak valid. Silakan mulai dari portal tes.');
        window.location.href = 'test-portal.html';
        return;
    }

    testSession = JSON.parse(sessionData);

    // Initialize navigator FIRST (before loading questions)
    initializeNavigator();

    // Load random questions
    await loadQuestions();

    // Display first question
    displayQuestion();

    // Start timer
    startTimer();
}

async function loadQuestions() {
    try {
        // Get random questions from database
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .limit(200); // Get pool of questions

        if (error) throw error;

        if (!data || data.length < TOTAL_QUESTIONS) {
            alert('Tidak ada cukup soal di database. Minimal perlu ' + TOTAL_QUESTIONS + ' soal.');
            return;
        }

        // Randomly select TOTAL_QUESTIONS questions
        const shuffled = data.sort(() => 0.5 - Math.random());
        questions = shuffled.slice(0, TOTAL_QUESTIONS);

        // Shuffle options for each question
        questions = questions.map(q => ({
            ...q,
            options: shuffleOptions([
                { letter: 'A', text: q.option_a },
                { letter: 'B', text: q.option_b },
                { letter: 'C', text: q.option_c },
                { letter: 'D', text: q.option_d }
            ])
        }));

    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Gagal memuat soal. Silakan refresh halaman.');
    }
}

function shuffleOptions(options) {
    return options.sort(() => 0.5 - Math.random());
}

// Initialize Navigator Grid - SIMPLE & DIRECT
function initializeNavigator() {
    const navigatorGrid = document.getElementById('navigatorGrid');
    if (!navigatorGrid) {
        console.error('navigatorGrid not found');
        return;
    }

    navigatorGrid.innerHTML = '';

    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
        const button = document.createElement('button');
        button.className = 'nav-button unanswered';
        button.textContent = String(i + 1);
        button.setAttribute('data-index', String(i));
        button.type = 'button';

        // Add click handler
        button.addEventListener('click', function() {
            currentQuestionIndex = i;
            displayQuestion();
        });

        button.id = 'nav-btn-' + i;
        navigatorGrid.appendChild(button);
    }

    console.log('Navigator initialized with ' + TOTAL_QUESTIONS + ' buttons');
}

// Update Navigator Button Status
function updateNavigator() {
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
        const button = document.getElementById('nav-btn-' + i);
        if (!button) continue;

        // Reset class
        button.className = 'nav-button';

        // Add appropriate status class
        if (i === currentQuestionIndex) {
            button.classList.add('active');
        }

        if (flaggedQuestions.has(i)) {
            button.classList.add('flagged');
        } else if (answers[i]) {
            button.classList.add('answered');
        } else {
            button.classList.add('unanswered');
        }
    }
}

function displayQuestion() {
    if (!questions || questions.length === 0) {
        console.log('Questions not loaded yet');
        return;
    }

    const question = questions[currentQuestionIndex];

    document.getElementById('questionNumber').textContent = 'Pertanyaan ' + (currentQuestionIndex + 1);
    document.getElementById('questionText').textContent = question.question_text;
    document.getElementById('progressText').textContent = 'Soal ' + (currentQuestionIndex + 1) + ' dari ' + TOTAL_QUESTIONS;

    // Display options
    const optionsList = document.getElementById('optionsList');
    optionsList.innerHTML = '';

    question.options.forEach(function(option) {
        const isChecked = answers[currentQuestionIndex] === option.letter;
        const liElement = document.createElement('li');
        liElement.className = 'option-item';

        const label = document.createElement('label');
        label.className = 'option-label';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'answer';
        radio.value = option.letter;
        if (isChecked) radio.checked = true;
        radio.addEventListener('change', function() {
            answers[currentQuestionIndex] = option.letter;
            updateNavigator();
        });

        const span = document.createElement('span');
        span.className = 'option-text';
        span.textContent = option.letter + '. ' + option.text;

        label.appendChild(radio);
        label.appendChild(span);
        liElement.appendChild(label);
        optionsList.appendChild(liElement);
    });

    // Add flag button - CLEAR OLD BUTTON FIRST
    const oldFlagContainer = document.getElementById('flag-container');
    if (oldFlagContainer) {
        oldFlagContainer.remove();
    }

    const flagContainer = document.createElement('div');
    flagContainer.id = 'flag-container';
    flagContainer.style.display = 'flex';
    flagContainer.style.marginTop = '16px';
    flagContainer.style.justifyContent = 'flex-end';

    const flagBtn = document.createElement('button');
    flagBtn.className = 'flag-button' + (flaggedQuestions.has(currentQuestionIndex) ? ' flagged' : '');
    flagBtn.textContent = flaggedQuestions.has(currentQuestionIndex) ? '✅ Tandai Selesai' : '🚩 Tandai untuk Review';
    flagBtn.type = 'button';
    flagBtn.addEventListener('click', function() {
        if (flaggedQuestions.has(currentQuestionIndex)) {
            flaggedQuestions.delete(currentQuestionIndex);
        } else {
            flaggedQuestions.add(currentQuestionIndex);
        }
        displayQuestion();
    });
    flagContainer.appendChild(flagBtn);
    optionsList.parentElement.appendChild(flagContainer);

    // Update navigation buttons
    updateNavigator();
    updateNavigationButtons();

    // Scroll to top
    window.scrollTo(0, 0);
}

window.saveAnswer = function(answer) {
    answers[currentQuestionIndex] = answer;
    updateNavigator();
};

window.nextQuestion = function() {
    if (currentQuestionIndex < TOTAL_QUESTIONS - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
};

window.previousQuestion = function() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
};

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    prevBtn.disabled = currentQuestionIndex === 0;

    if (currentQuestionIndex === TOTAL_QUESTIONS - 1) {
        nextBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
    } else {
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
    }

    // Check if all questions answered
    const allAnswered = checkAllAnswered();
    submitBtn.disabled = !allAnswered;
}

// Check if all questions are answered
function checkAllAnswered() {
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
        if (!answers[i]) {
            return false;
        }
    }
    return true;
}

function startTimer() {
    const timerDisplay = document.getElementById('timerDisplay');
    const timerElement = document.getElementById('timer');

    timerInterval = setInterval(function() {
        timeRemaining--;

        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerDisplay.textContent = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');

        // Change timer color based on time remaining
        if (timeRemaining <= 300) { // 5 minutes
            timerElement.classList.add('danger');
        } else if (timeRemaining <= 600) { // 10 minutes
            timerElement.classList.add('warning');
        }

        // Auto submit when time runs out
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            submitTest(true);
        }
    }, 1000);
}

window.submitTest = async function(autoSubmit) {
    if (autoSubmit === undefined) autoSubmit = false;

    // Check if all answered
    const allAnswered = checkAllAnswered();

    if (!allAnswered) {
        const answeredCount = Object.keys(answers).length;
        const unansweredCount = TOTAL_QUESTIONS - answeredCount;
        alert('PERHATIAN!\n\nAnda masih memiliki ' + unansweredCount + ' soal yang belum dijawab.\n\nHarap jawab semua soal sebelum submit tes.');
        return;
    }

    if (!autoSubmit) {
        const confirmed = confirm('Apakah Anda yakin ingin submit tes? Anda tidak dapat mengubah jawaban setelah submit.');
        if (!confirmed) return;
    }

    clearInterval(timerInterval);

    // Calculate score
    let correctAnswers = 0;
    const answerRecords = [];

    for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const userAnswer = answers[i];
        const isCorrect = userAnswer === question.correct_answer;

        if (isCorrect) correctAnswers++;

        answerRecords.push({
            session_id: testSession.sessionId,
            question_id: question.id,
            selected_answer: userAnswer || null,
            is_correct: isCorrect
        });
    }

    const score = Math.round((correctAnswers / TOTAL_QUESTIONS) * 100);
    const duration = TEST_DURATION - timeRemaining;

    try {
        // Save answers
        const { error: answersError } = await supabase
            .from('test_answers')
            .insert(answerRecords);

        if (answersError) throw answersError;

        // Update test session
        const { error: sessionError } = await supabase
            .from('test_sessions')
            .update({
                end_time: new Date().toISOString(),
                duration_seconds: duration,
                score: score,
                total_questions: TOTAL_QUESTIONS,
                status: 'completed'
            })
            .eq('id', testSession.sessionId);

        if (sessionError) throw sessionError;

        // Clear session storage
        sessionStorage.removeItem('testSession');

        // Show result
        alert('✅ Tes selesai!\n\nSkor Anda: ' + score + '%\nJawaban Benar: ' + correctAnswers + ' dari ' + TOTAL_QUESTIONS + '\n\nTerima kasih telah mengikuti tes.');

        // Redirect to homepage
        window.location.href = 'index.html';

    } catch (error) {
        console.error('Error submitting test:', error);
        alert('Gagal menyimpan hasil tes. Silakan hubungi admin.');
    }
};

// Prevent page refresh/close during test
window.addEventListener('beforeunload', function(e) {
    if (testSession && timerInterval) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initTest);
