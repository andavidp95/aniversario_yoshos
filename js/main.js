document.addEventListener('DOMContentLoaded', () => {
    const config = {
        correctPassword: "261025",
        maxDigits: 6,
        msgStart: "Autenticación Requerida",
        msgError: "Código Incorrecto",
        msgSuccess: "Acceso Concedido"
    };

    let currentInput = "";

    // Audios de efectos
    const keySound = new Audio('song/key_press.mp3');
    const accessSound = new Audio('song/access.mp3');
    const errorSound = new Audio('song/error.mp3');
    const deleteSound = new Audio('song/delete.mp3');
    
    // Audio de música de fondo (Title)
    const bgMusic = new Audio('song/title.mp3');
    bgMusic.loop = true;
    let isMusicPlaying = false;

    // Audio de la secuencia de la Etapa 3 (song/aniversario.mp3 si existe, si no title.mp3)
    const stage3Audio = new Audio();
    stage3Audio.loop = true;
    let stage3TrackReady = false;
    let lyricsData = [];
    let requestAnimFrameId = null;
    let stage3StartTime = null;
    let sequenceDuration = 0;
    let stage3Ended = false;

    fetch('song/aniversario.mp3', { method: 'HEAD' })
        .then(response => {
            stage3TrackReady = response.ok;
        })
        .catch(() => {
            stage3TrackReady = false;
        });

    // Elementos del DOM - Etapa 1
    const dialogText = document.getElementById('dialog-text');
    const pwdDisplay = document.getElementById('password-display');
    const keys = document.querySelectorAll('.glass-btn[data-num]');
    const btnClear = document.getElementById('btn-clear');
    const btnEnter = document.getElementById('btn-enter');
    const btnMusic = document.getElementById('btn-music');
    const btnVolumeToggle = document.getElementById('btn-volume-toggle');
    const sliderWrapper = document.getElementById('slider-wrapper');
    const iconMusicOn = document.getElementById('icon-music-on');
    const iconMusicOff = document.getElementById('icon-music-off');
    const volumeSlider = document.getElementById('volume-slider');
    const btnHelp = document.getElementById('btn-help');
    const hintPopup = document.getElementById('hint-popup');

    // Elementos de las pantallas
    const stage1 = document.getElementById('stage-1');
    const stage2 = document.getElementById('stage-2');
    const stage3 = document.getElementById('stage-3');
    const stage4 = document.getElementById('stage-4');
    const btnReveal = document.getElementById('btn-reveal');
    const lyricsContainer = document.getElementById('lyrics-container');
    const btnYes = document.getElementById('btn-yes');
    const footerQuestion = document.getElementById('footer-question');
    const yesResponse = document.getElementById('yes-response');
    const heartsBurst = document.getElementById('hearts-burst');
    const invitePhoto = document.getElementById('invite-photo');

    // Foto de la invitación: img/yoshi.jpg → img/cena.jpg → img/cena.png → img/yoshi.svg
    const tryNextPhoto = () => {
        if (!invitePhoto.dataset.fallback) {
            invitePhoto.dataset.fallback = 'cena';
            invitePhoto.src = 'img/cena.jpg';
        } else if (invitePhoto.dataset.fallback === 'cena') {
            invitePhoto.dataset.fallback = 'cena-png';
            invitePhoto.src = 'img/cena.png';
        } else if (invitePhoto.dataset.fallback === 'cena-png') {
            invitePhoto.dataset.fallback = 'yoshi';
            invitePhoto.src = 'img/yoshi.svg';
        }
    };
    invitePhoto.addEventListener('error', tryNextPhoto);
    if (invitePhoto.complete && invitePhoto.naturalWidth === 0) {
        tryNextPhoto();
    }

    // --- CARGAR EL JSON DE LAS LETRAS ---
    fetch('script.json')
        .then(response => response.json())
        .then(data => {
            lyricsData = data;

            sequenceDuration = lyricsData.reduce((max, item) => {
                return Math.max(max, item.start + item.duration);
            }, 0);
            
            lyricsData.forEach((item, index) => {
                const el = document.createElement('div');
                el.className = `lyric-line ${item.type}`;
                el.id = `lyric-${index}`;
                
                // Si el tipo es 'flower', inyectamos la flor + ambiente de brisa
                if (item.type === 'flower') {
                    el.innerHTML = `
                        <!-- Brillo palpitante de tensión (Latido) -->
                        <div class="flower-glow"></div>
                        
                        <!-- Ambiente: Viento y pétalos -->
                        <div class="duel-atmosphere">
                            <div class="spark spark-1"></div>
                            <div class="spark spark-2"></div>
                            <div class="spark spark-3"></div>
                            <div class="spark spark-4"></div>
                            <div class="spark spark-5"></div>
                            <div class="spark spark-6"></div>
                            <div class="wind-line w1"></div>
                            <div class="wind-line w2"></div>
                            <div class="wind-line w3"></div>
                        </div>

                        <svg class="animated-flower" viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">
                            <!-- Tallo -->
                            <path class="flower-path stem" d="M200,500 C220,400 170,300 200,220" />
                            
                            <!-- Hojas Base -->
                            <path class="flower-path leaf" d="M190,380 C100,400 40,320 60,250 C100,280 150,340 195,360" />
                            <path class="flower-path leaf" d="M210,320 C280,340 350,280 340,200 C300,240 250,290 205,300" />
                            
                            <!-- Pétalos Traseros -->
                            <path class="flower-path petal-back" d="M200,220 C140,160 100,80 150,40 C170,80 180,150 200,220" />
                            <path class="flower-path petal-back" d="M200,220 C260,160 300,80 250,40 C230,80 220,150 200,220" />
                            
                            <!-- Pétalos Laterales Exteriores -->
                            <path class="flower-path petal" d="M200,220 C120,200 40,140 30,70 C90,100 150,160 200,220" />
                            <path class="flower-path petal" d="M200,220 C280,200 360,140 370,70 C310,100 250,160 200,220" />
                            
                            <!-- Pétalos Laterales Interiores -->
                            <path class="flower-path petal" d="M200,220 C100,240 20,220 10,150 C70,180 140,210 200,220" />
                            <path class="flower-path petal" d="M200,220 C300,240 380,220 390,150 C330,180 260,210 200,220" />
                            
                            <!-- Pétalo Central Principal -->
                            <path class="flower-path petal-center" d="M200,220 C160,120 170,20 200,5 C230,20 240,120 200,220" />
                            
                            <!-- Detalles internos -->
                            <path class="flower-path detail" d="M200,220 Q185,150 175,90" />
                            <path class="flower-path detail" d="M200,220 Q215,150 225,90" />
                            <path class="flower-path detail" d="M200,220 Q195,130 190,70" />
                            <path class="flower-path detail" d="M200,220 Q205,130 210,70" />

                            <!-- Pétalos desprendiéndose por el viento -->
                            <path class="flying-petal fp1" d="M220,150 Q230,130 250,120" fill="none" stroke="#fff" stroke-width="2"/>
                            <path class="flying-petal fp2" d="M180,120 Q160,90 130,100" fill="none" stroke="#fff" stroke-width="1.5"/>
                            <path class="flying-petal fp3" d="M260,100 Q280,70 310,60" fill="none" stroke="#fff" stroke-width="2"/>
                            
                            <!-- Polen / Puntos de luz -->
                            <circle cx="175" cy="85" r="4" class="pollen" />
                            <circle cx="225" cy="85" r="4" class="pollen" />
                            <circle cx="190" cy="65" r="4" class="pollen" />
                            <circle cx="210" cy="65" r="4" class="pollen" />
                            <circle cx="200" cy="50" r="5" class="pollen" />
                        </svg>
                    `;
                } else {
                    el.textContent = item.text;
                }

                lyricsContainer.appendChild(el);
                item.element = el; 
            });
        })
        .catch(error => console.error("Asegúrate de estar corriendo esto en un servidor local (Live Server).", error));

    bgMusic.volume = volumeSlider.value / 100;
    stage3Audio.volume = volumeSlider.value / 100;

    const initMusic = () => {
        if (!isMusicPlaying && bgMusic.volume > 0) {
            bgMusic.play().then(() => {
                isMusicPlaying = true;
                iconMusicOn.style.display = 'block';
                iconMusicOff.style.display = 'none';
            }).catch(e => console.log("Esperando interacción."));
        }
    };
    document.body.addEventListener('click', initMusic, { once: true });

    btnVolumeToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sliderWrapper.classList.toggle('open');
        btnVolumeToggle.classList.toggle('open');
    });

    volumeSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        bgMusic.volume = val / 100;
        stage3Audio.volume = val / 100;
        
        if (val == 0) {
            iconMusicOn.style.display = 'none';
            iconMusicOff.style.display = 'block';
        } else if (isMusicPlaying) {
            iconMusicOn.style.display = 'block';
            iconMusicOff.style.display = 'none';
        }
    });

    btnMusic.addEventListener('click', (e) => {
        e.stopPropagation(); 
        if (bgMusic.paused) {
            bgMusic.play();
            isMusicPlaying = true;
            if(volumeSlider.value == 0) {
                volumeSlider.value = 40;
                bgMusic.volume = 0.4;
                stage3Audio.volume = 0.4;
            }
            iconMusicOn.style.display = 'block';
            iconMusicOff.style.display = 'none';
        } else {
            bgMusic.pause();
            isMusicPlaying = false;
            iconMusicOn.style.display = 'none';
            iconMusicOff.style.display = 'block';
        }
    });

    btnHelp.addEventListener('click', (e) => {
        e.stopPropagation();
        hintPopup.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!btnHelp.contains(e.target) && !hintPopup.contains(e.target)) {
            hintPopup.classList.remove('show');
        }
    });

    const updateDisplay = () => {
        pwdDisplay.innerHTML = "";
        for (let i = 0; i < config.maxDigits; i++) {
            const span = document.createElement('span');
            span.className = 'pwd-digit';
            if (i < currentInput.length) {
                span.textContent = currentInput[i];
                // Se alumbran de verde solo si es correcta en esa posición
                if (currentInput[i] === config.correctPassword[i]) {
                    span.classList.add('correct');
                } else {
                    span.classList.add('wrong');
                }
            } else {
                span.textContent = "_";
            }
            pwdDisplay.appendChild(span);
            if (i % 2 === 1 && i !== config.maxDigits - 1) {
                const space = document.createElement('span');
                space.innerHTML = '&nbsp;&nbsp;&nbsp;';
                pwdDisplay.appendChild(space);
            } else if (i !== config.maxDigits - 1) {
                const space = document.createElement('span');
                space.innerHTML = '&nbsp;';
                pwdDisplay.appendChild(space);
            }
        }
    };

    keys.forEach(key => {
        key.addEventListener('click', (e) => {
            keySound.currentTime = 0;
            keySound.play().catch(e => console.log(e));

            if (currentInput.length < config.maxDigits) {
                currentInput += e.target.getAttribute('data-num');
                dialogText.textContent = config.msgStart;
                dialogText.style.color = "rgba(255, 255, 255, 0.8)";
                updateDisplay();
            }
        });
    });

    btnClear.addEventListener('click', () => {
        deleteSound.currentTime = 0;
        deleteSound.play().catch(e => console.log(e));

        currentInput = "";
        dialogText.textContent = config.msgStart;
        dialogText.style.color = "rgba(255, 255, 255, 0.8)";
        updateDisplay();
    });

    btnEnter.addEventListener('click', () => {
        if (currentInput === config.correctPassword) {
            accessSound.currentTime = 0;
            accessSound.play().catch(e => console.log(e));

            dialogText.textContent = config.msgSuccess;
            dialogText.style.color = "#55efc4"; 
            dialogText.style.textShadow = "0 0 10px rgba(85, 239, 196, 0.5)";
            
            bgMusic.pause();
            isMusicPlaying = false;
            
            setTimeout(() => {
                stage1.classList.remove('active');
                stage1.classList.add('hidden');
                
                stage2.classList.remove('hidden');
                stage2.classList.add('active');
            }, 1500);
        } else {
            errorSound.currentTime = 0;
            errorSound.play().catch(e => console.log(e));

            dialogText.textContent = config.msgError;
            dialogText.style.color = "#ff7675"; 
            dialogText.style.textShadow = "0 0 10px rgba(255, 118, 117, 0.5)";
            currentInput = ""; 
            updateDisplay();
        }
    });

    // --- LÓGICA DE SINCRONIZACIÓN DE LETRAS (POR TIEMPO) ---
    function syncLyrics() {
        if (stage3StartTime === null || stage3Ended) return;

        if (!lyricsData.length) {
            requestAnimFrameId = requestAnimationFrame(syncLyrics);
            return;
        }

        const now = (performance.now() - stage3StartTime) / 1000;
        
        lyricsData.forEach(item => {
            if (!item.element) return; 
            
            if (now >= item.start && now <= (item.start + item.duration)) {
                if (!item.element.classList.contains('visible')) {
                    item.element.classList.add('visible');
                }
            } else {
                if (item.element.classList.contains('visible')) {
                    item.element.classList.remove('visible');
                }
            }
        });

        if (now >= sequenceDuration + 1.5) {
            endStage3();
            return;
        }
        
        requestAnimFrameId = requestAnimationFrame(syncLyrics);
    }

    const startStage3Track = () => {
        stage3Audio.src = stage3TrackReady ? 'song/aniversario.mp3' : 'song/title.mp3';
        stage3Audio.currentTime = 0;
        stage3Audio.play().catch(e => console.log(e));
    };

    stage3Audio.addEventListener('error', () => {
        if (!stage3Audio.src.endsWith('song/title.mp3')) {
            stage3Audio.src = 'song/title.mp3';
            stage3Audio.play().catch(e => console.log(e));
        }
    });

    const endStage3 = () => {
        if (stage3Ended) return;
        stage3Ended = true;

        cancelAnimationFrame(requestAnimFrameId);
        stage3Audio.pause();
        
        stage3.classList.remove('active');
        stage3.classList.add('hidden');
        
        stage4.classList.remove('hidden');
        stage4.classList.add('active');
    };

    btnReveal.addEventListener('click', () => {
        stage2.classList.remove('active');
        stage2.classList.add('hidden');
        
        stage3.classList.remove('hidden');
        stage3.classList.add('active');

        stage3Ended = false;
        stage3StartTime = performance.now();
        startStage3Track();
        requestAnimFrameId = requestAnimationFrame(syncLyrics);
    });

    // --- RESPUESTA "¡SÍ!" Y CORAZONES ---
    const spawnHeart = (container, x, y, size, duration, delay, color) => {
        const heart = document.createElement('span');
        heart.className = 'burst-heart';
        heart.textContent = '♥';
        heart.style.left = `${x}%`;
        heart.style.top = `${y}%`;
        heart.style.fontSize = `${size}px`;
        heart.style.color = color;
        heart.style.animationDuration = `${duration}s`;
        heart.style.animationDelay = `${delay}s`;
        container.appendChild(heart);
        heart.addEventListener('animationend', () => heart.remove());
    };

    btnYes.addEventListener('click', (e) => {
        e.stopPropagation();

        accessSound.currentTime = 0;
        accessSound.play().catch(err => console.log(err));

        footerQuestion.classList.add('hidden');
        btnYes.classList.add('hidden');
        yesResponse.classList.remove('hidden');

        const colors = ['#ff6b81', '#ffd166', '#ef476f', '#d4af37', '#ff8fab'];
        for (let i = 0; i < 24; i++) {
            spawnHeart(
                heartsBurst,
                Math.random() * 100,
                60 + Math.random() * 35,
                14 + Math.random() * 26,
                3 + Math.random() * 3,
                Math.random() * 1.2,
                colors[Math.floor(Math.random() * colors.length)]
            );
        }

        const waMsg = encodeURIComponent("¡Sí! Acepto tu invitación a nuestra cena de aniversario ❤️");
        setTimeout(() => {
            window.open(`https://wa.me/593986092411?text=${waMsg}`, '_blank');
        }, 900);
    });

    updateDisplay();

});
