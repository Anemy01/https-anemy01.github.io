/* ----------------------------------------------------------
   FILE: public.js - FULL AI ENGINE (FINAL VERSION)
   ---------------------------------------------------------- */

let generatedQuestions = [];
let currentQIndex = 0;
let score = 0;
let timeLeft = 30; 
let timerInterval;

// --- AUDIO SETUP ---
const bgm = new Audio('bgm_public.mp3'); 
const sfxCorrect = [new Audio('Benar1.mp3'), new Audio('benar2.mp3'), new Audio('benar3.mp3'), new Audio('benar4.mp3'), new Audio('benar5.mp3')]; 
const sfxWrong = [new Audio('salah1.mp3'), new Audio('salah2.mp3'), new Audio('salah3.mp3'), new Audio('salah4.mp3'), new Audio('salah5.mp3')];
const songVictory = new Audio('victory.mp3');
const songGameOver = new Audio('gameover.mp3');

// [1] INITIALIZE SYSTEM (Ambil dari soal.json)
window.onload = async () => {
    try {
        // Mengambil bank soal dari file JSON eksternal
        const response = await fetch('soal.json');
        const data = await response.json();
        
        if (data.bank_soal) {
            // Ambil 10 soal secara acak agar tiap kelompok beda soal
            generatedQuestions = data.bank_soal
                .sort(() => 0.5 - Math.random())
                .slice(0, 10);
            
            // Putar BGM (volume kecil agar tidak berisik)
            bgm.loop = true;
            bgm.volume = 0.5;
            bgm.play().catch(e => console.log("Menunggu interaksi user untuk BGM"));

            // Langsung arahkan ke layar input nama kelompok
            showSection('name-screen');
        }
    } catch (e) {
        console.error("Database soal error!", e);
        alert("ERROR: Gagal memuat soal.json!");
    }
};

// [2] FUNGSI MEMULAI KUIS
function startQuizWithGroup() {
    const nameInput = document.getElementById('group-name-input').value;
    
    if (nameInput.trim() === "") {
        alert("Isi dulu nama kelompoknya, mas/mbak!");
        return;
    }

    // Simpan nama di localStorage sementara
    localStorage.setItem('current_group_name', nameInput);
    score = 0;
    currentQIndex = 0;
    
    showSection('quiz-screen');
    loadQuestion();
}

// [3] LOAD SOAL & TIMER
function loadQuestion() {
    clearInterval(timerInterval);
    timeLeft = 30; 
    
    const q = generatedQuestions[currentQIndex];
    document.getElementById('q-count').innerText = `ANALYSIS: ${currentQIndex + 1}/10`;
    document.getElementById('question-text').innerText = q.pertanyaan;
    
    const container = document.getElementById('options-container');
    container.innerHTML = "";

    // Kita acak pilihan jawabannya biar gak hapalan posisi
    const shuffledChoices = [...q.pilihan].sort(() => 0.5 - Math.random());

    shuffledChoices.forEach((pil) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        
        // LOGIKA AI: Cek apakah pilihan ini adalah jawaban benar (punya tanda [])
        const isCorrect = pil.includes("[") && pil.includes("]");
        
        // Hilangkan tanda [] sebelum ditampilkan ke layar (agar rapi)
        const cleanText = pil.replace("[", "").replace("]", "");
        btn.innerText = cleanText;
        
        btn.onclick = () => checkAnswer(isCorrect);
        container.appendChild(btn);
    });

    startTimer();
}

function startTimer() {
    const timerText = document.getElementById('q-timer');
    const fillBar = document.getElementById('timer-fill');
    
    timerInterval = setInterval(() => {
        timeLeft--;
        timerText.innerText = timeLeft + "s";
        
        // Update bar visual mengecil
        if (fillBar) {
            fillBar.style.width = (timeLeft / 30 * 100) + "%";
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            playSfx(sfxWrong);
            nextQuestion();
        }
    }, 1000);
}

// [4] CEK JAWABAN & SFX
function checkAnswer(isCorrect) {
    clearInterval(timerInterval);
    
    if (isCorrect) {
        score += 10;
        playSfx(sfxCorrect);
    } else {
        playSfx(sfxWrong);
    }
    
    // Kasih jeda 1 detik biar suara selesai dulu baru ganti soal
    setTimeout(nextQuestion, 1200);
}

function playSfx(audioArray) {
    const random = audioArray[Math.floor(Math.random() * audioArray.length)];
    random.currentTime = 0;
    random.play();
}

function nextQuestion() {
    currentQIndex++;
    if (currentQIndex < 10) {
        loadQuestion();
    } else {
        finishQuiz();
    }
}

// [5] LAYAR SKOR & PENYIMPANAN DATA
function finishQuiz() {
    bgm.pause();
    clearInterval(timerInterval);
    
    showSection('score-screen');
    document.getElementById('final-score').innerText = score;

    const groupName = localStorage.getItem('current_group_name') || "Anonymous";
    
    // AMBIL DATA LAMA
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard_data')) || [];
    
    // SIMPAN DATA BARU (Pastikan nama key-nya "waktu")
    leaderboard.push({
        nama: groupName,
        skor: score,
        waktu: new Date().toLocaleTimeString('id-ID') // Ini yang akan dibaca Admin
    });
    
    localStorage.setItem('leaderboard_data', JSON.stringify(leaderboard));
    localStorage.setItem('redirect_to_leaderboard', 'true');

    if (score >= 70) songVictory.play(); else songGameOver.play();
}

// [7] SELESAI SEMUA (Balik ke Admin)
function closeSessiAndShowLeaderboard() {
    // Kasih tanda buat Admin
    localStorage.setItem('target_section', 'leaderboard-screen');
    // Balik ke admin
    window.location.href = "admin.html";
}

// Fungsi Helper Ganti Layar
function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.style.display = 'none');
    const target = document.getElementById(id);
    if(target) target.style.display = 'block';
}
