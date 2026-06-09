document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias UI ---
    const welcomeScreen = document.getElementById('welcome-screen');
    const lprScreen = document.getElementById('lpr-scanner-screen');
    const mainScreen = document.getElementById('main-screen');
    const startBtn = document.getElementById('start-btn');
    const addCarBtn = document.getElementById('add-car-btn');
    const btnPrev = document.getElementById('btn-prev');
    const btnPause = document.getElementById('btn-pause');
    const btnNext = document.getElementById('btn-next');
    
    // Paneles y contenedores
    const queueListEl = document.getElementById('queue-list');
    const finishedListEl = document.getElementById('finished-list');
    const queueCountEl = document.getElementById('queue-count');
    const finishedCountEl = document.getElementById('finished-count');
    const revenueEl = document.getElementById('total-revenue');
    
    // HUD Tunnel
    const currentMissionEl = document.getElementById('current-mission');
    const carDetailsCard = document.getElementById('active-car-details');
    const hudModelEl = document.getElementById('hud-car-model');
    const hudPlateEl = document.getElementById('hud-car-plate');
    const hudOrderEl = document.getElementById('hud-car-order');
    const starsContainer = document.getElementById('dirt-stars');
    const hudTimerEl = document.getElementById('hud-timer');
    
    // Multimedia
    const audioAlert = document.getElementById('audio-alert');
    const audioScan = document.getElementById('audio-scan');
    const audioCash = document.getElementById('audio-cash');
    const webcamFeed = document.getElementById('webcam-feed');
    const ticketModal = document.getElementById('ticket-modal');
    
    // Animación
    const animatedCar = document.getElementById('animated-car');
    const tunnelBackground = document.querySelector('.tunnel-background');
    const typingText = document.getElementById('typing-text');
    
    // --- Estado de la App ---
    let queue = [];
    let finished = [];
    let activeCar = null;
    let totalRevenue = 0;
    let washCounter = 1;
    let isWashing = false;
    let isAuto = true;
    let washTimeouts = []; // Para poder cancelar animaciones
    let washTimeLeft = 0;
    let timerInterval = null;
    
    // Bases de datos falsas
    const carModels = [
        { model: "VW Gol", img: "gol.png", type: "Auto", basePrice: 10000 },
        { model: "Ford EcoSport", img: "ecosport.png", type: "Auto", basePrice: 12000 },
        { model: "Renault Kangoo", img: "gol.png", type: "Utilitario", basePrice: 13000 },
        { model: "BMW X5", img: "bmw.png", type: "Camioneta", basePrice: 18000 },
        { model: "Toyota Hilux", img: "hilux.png", type: "Camioneta", basePrice: 20000 },
        { model: "VW Amarok", img: "hilux.png", type: "Camioneta", basePrice: 20000 }
    ];
    const washTypes = [
        { name: "Básico", mult: 1 },
        { name: "Premium", mult: 1.5 },
        { name: "VIP", mult: 2 }
    ];
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    
    // --- Funciones Helpers ---
    function getRandomPlate() {
        return (letters[Math.floor(Math.random()*26)] + letters[Math.floor(Math.random()*26)] + 
               Math.floor(Math.random()*10) + Math.floor(Math.random()*10) + Math.floor(Math.random()*10) + 
               letters[Math.floor(Math.random()*26)] + letters[Math.floor(Math.random()*26)]).toUpperCase();
    }
    
    function generateRandomCar() {
        const base = carModels[Math.floor(Math.random() * carModels.length)];
        const wash = washTypes[Math.floor(Math.random() * washTypes.length)];
        return {
            id: washCounter++,
            model: base.model,
            type: base.type,
            washName: wash.name,
            img: base.img,
            price: base.basePrice * wash.mult,
            plate: getRandomPlate(),
            dirtLevel: Math.floor(Math.random() * 5) + 1,
            order: "LAV-0" + Math.floor(Math.random() * 900 + 100)
        };
    }
    
    function updateUI() {
        // Render Queue
        queueCountEl.textContent = queue.length;
        queueListEl.innerHTML = '';
        
        let accumulatedTime = washTimeLeft > 0 ? washTimeLeft : 0;
        
        queue.forEach((car, index) => {
            let myETA = accumulatedTime + (index * 14); // 12s de lavado + 2s de escáner aprox
            let min = Math.floor(myETA / 60);
            let sec = myETA % 60;
            let etaStr = (min < 10 ? "0"+min : min) + ":" + (sec < 10 ? "0"+sec : sec);
            
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `
                <div class="item-top">
                    <span>${index + 1}. ${car.model}</span>
                    <span class="item-plate">${car.plate}</span>
                </div>
                <div class="item-bottom">Ticket: ${car.order} - [${car.washName}] $${car.price} <br> ETA: ${etaStr}</div>
            `;
            queueListEl.appendChild(div);
        });
        
        // Render Finished
        finishedCountEl.textContent = finished.length;
        finishedListEl.innerHTML = '';
        finished.forEach(car => {
            const div = document.createElement('div');
            div.className = 'list-item finished';
            div.innerHTML = `
                <div class="item-top">
                    <span>${car.model}</span>
                    <span class="item-plate">${car.plate}</span>
                </div>
                <div class="item-bottom">LISTO PARA ENTREGAR</div>
                <button class="deliver-btn" onclick="deliverCar(${car.id})"><i class="fa-solid fa-key"></i> ENTREGAR Y COBRAR</button>
            `;
            finishedListEl.appendChild(div);
        });
        
        // Render Revenue
        revenueEl.textContent = "$" + totalRevenue.toLocaleString('es-AR');
    }
    
    // Expone la función de entregar al objeto window para el onclick
    window.deliverCar = function(carId) {
        const carIndex = finished.findIndex(c => c.id === carId);
        if(carIndex > -1) {
            const car = finished[carIndex];
            
            // Llenar ticket
            document.getElementById('ticket-model').textContent = car.model + " (" + car.type + ")";
            document.getElementById('ticket-plate').textContent = car.plate;
            document.getElementById('ticket-type').textContent = car.washName;
            document.getElementById('ticket-price').textContent = "$" + car.price;
            
            ticketModal.classList.add('active');
            if(audioCash) { audioCash.currentTime = 0; audioCash.play().catch(e => {}); }
            
            totalRevenue += car.price;
            finished.splice(carIndex, 1);
            updateUI();
        }
    };
    
    document.getElementById('close-ticket-btn').addEventListener('click', () => {
        ticketModal.classList.remove('active');
    });
    
    // --- Lógica Principal ---
    
    function addCarToQueue() {
        queue.push(generateRandomCar());
        updateUI();
        if(audioAlert) { audioAlert.currentTime = 0; audioAlert.play().catch(e => {}); }
        checkAndStartWash();
    }
    
    function checkAndStartWash() {
        if (!isWashing && queue.length > 0) {
            isWashing = true;
            activeCar = queue.shift();
            updateUI();
            startLPRScanner(activeCar);
        }
    }
    
    function startLPRScanner(car) {
        mainScreen.classList.remove('active');
        lprScreen.classList.add('active');
        if(audioScan) { audioScan.currentTime = 0; audioScan.play().catch(e => {}); }
        
        // Efecto máquina de escribir
        let plateText = isPublicMode ? "***-***" : car.plate;
        let text = `> Vehículo detectado.\\n> Procesando imagen...\\n> Patente: ${plateText}\\n> Cruzando con base de datos...\\n> OK. Vehículo: ${car.model}\\n> Orden de Trabajo: ${car.order}\\n> Ingresando a zona de lavado...`;
        typingText.innerHTML = '';
        let i = 0;
        
        let typeInterval = setInterval(() => {
            typingText.innerHTML += text.charAt(i) === '\\n' ? '<br>' : text.charAt(i);
            i++;
            if (i >= text.length) {
                clearInterval(typeInterval);
                setTimeout(() => {
                    startWashingPhase(car);
                }, 1000);
            }
        }, 30);
    }
    
    function startWashingPhase(car) {
        lprScreen.classList.remove('active');
        mainScreen.classList.add('active');
        
        // Actualizar HUD
        currentMissionEl.textContent = "Limpieza Nivel " + car.dirtLevel;
        currentMissionEl.style.color = "#fff";
        carDetailsCard.style.display = 'block';
        hudModelEl.textContent = car.model;
        hudPlateEl.textContent = car.plate;
        hudOrderEl.textContent = "ORD: " + car.order;
        
        // Efectos VIP
        if (car.washName === "VIP" || car.washName === "Premium") {
            document.querySelectorAll('.station').forEach(el => el.classList.add('station-vip'));
        } else {
            document.querySelectorAll('.station').forEach(el => el.classList.remove('station-vip'));
        }
        
        // Estrellas de suciedad
        starsContainer.innerHTML = '';
        for(let i=0; i<5; i++) {
            if(i < car.dirtLevel) starsContainer.innerHTML += '<i class="fa-solid fa-star active"></i>';
            else starsContainer.innerHTML += '<i class="fa-solid fa-star"></i>';
        }
        
        // Inyectar imagen del auto
        animatedCar.innerHTML = `<img src="assets/${car.img}" class="gta-car-img" alt="${car.model}">`;
        
        // Animación de lavado
        runWashAnimation();
    }
    
    function clearWashTimeouts() {
        washTimeouts.forEach(t => clearTimeout(t));
        washTimeouts = [];
        clearInterval(timerInterval);
        washTimeLeft = 0;
        hudTimerEl.textContent = "00:00";
    }
    
    function runWashAnimation() {
        clearWashTimeouts();
        
        washTimeLeft = 12; // 12 segundos dura la animación
        hudTimerEl.textContent = "00:" + (washTimeLeft < 10 ? "0"+washTimeLeft : washTimeLeft);
        
        timerInterval = setInterval(() => {
            washTimeLeft--;
            if(washTimeLeft < 0) washTimeLeft = 0;
            hudTimerEl.textContent = "00:" + (washTimeLeft < 10 ? "0"+washTimeLeft : washTimeLeft);
            updateUI(); // Actualizar ETAs de la cola
        }, 1000);
        
        animatedCar.style.transition = 'none';
        tunnelBackground.style.transition = 'none';
        animatedCar.style.left = '-40%';
        tunnelBackground.style.transform = 'translateX(0)';
        
        // Forzar reflow
        void animatedCar.offsetWidth;
        
        // Fase 1: Entrar al túnel
        animatedCar.style.transition = 'left 2s ease-in-out';
        animatedCar.style.left = '40%';
        
        let t1 = setTimeout(() => {
            // Fase 2: Mover el túnel (scroll) para simular avance
            tunnelBackground.style.transition = 'transform 8s linear';
            tunnelBackground.style.transform = 'translateX(-50%)';
            
            let t2 = setTimeout(() => {
                // Fase 3: Salir del túnel
                animatedCar.style.transition = 'left 2s ease-in';
                animatedCar.style.left = '120%';
                
                let t3 = setTimeout(() => {
                    // Misión Superada!
                    finishWash();
                }, 2000);
                washTimeouts.push(t3);
                
            }, 8000);
            washTimeouts.push(t2);
        }, 2000);
        washTimeouts.push(t1);
    }
    
    function finishWash() {
        clearWashTimeouts();
        currentMissionEl.textContent = "MISIÓN SUPERADA";
        currentMissionEl.style.color = "var(--gta-yellow)";
        carDetailsCard.style.display = 'none';
        starsContainer.innerHTML = '';
        
        finished.push(activeCar);
        activeCar = null;
        isWashing = false;
        
        updateUI();
        
        // Ver si hay otro en cola esperando
        if (isAuto) {
            setTimeout(checkAndStartWash, 2000);
        }
    }
    
    // --- Lógica Botones Manuales ---
    btnPause.addEventListener('click', () => {
        isAuto = !isAuto;
        if (isAuto) {
            btnPause.innerHTML = '<i class="fa-solid fa-pause"></i> PAUSAR AUTO';
            btnPause.style.borderColor = 'var(--gta-cyan)';
            checkAndStartWash();
        } else {
            btnPause.innerHTML = '<i class="fa-solid fa-play"></i> MODO MANUAL';
            btnPause.style.borderColor = 'var(--gta-pink)';
        }
    });

    btnNext.addEventListener('click', () => {
        if (isWashing) {
            // Forzar fin de lavado
            animatedCar.style.transition = 'none';
            tunnelBackground.style.transition = 'none';
            animatedCar.style.left = '120%';
            finishWash();
        } else {
            // Iniciar siguiente
            checkAndStartWash();
        }
    });

    btnPrev.addEventListener('click', () => {
        if (isWashing && activeCar) {
            // Cancelar lavado actual y volver a la cola
            clearWashTimeouts();
            animatedCar.style.transition = 'none';
            tunnelBackground.style.transition = 'none';
            animatedCar.style.left = '-40%';
            tunnelBackground.style.transform = 'translateX(0)';
            
            currentMissionEl.textContent = "LAVADO CANCELADO";
            currentMissionEl.style.color = "red";
            
            queue.unshift(activeCar);
            activeCar = null;
            isWashing = false;
            
            setTimeout(() => {
                currentMissionEl.textContent = "Esperando Vehículo...";
                currentMissionEl.style.color = "var(--text-hud)";
                carDetailsCard.style.display = 'none';
                starsContainer.innerHTML = '';
            }, 1500);
            
            updateUI();
        }
    });
    
    // --- Lógica Modo Cliente ---
    const toggleViewBtn = document.getElementById('toggle-view-btn');
    let isPublicMode = false;
    
    toggleViewBtn.addEventListener('click', () => {
        isPublicMode = !isPublicMode;
        document.body.classList.toggle('public-mode', isPublicMode);
        if(isPublicMode) {
            toggleViewBtn.textContent = 'CAMBIAR A VISTA ADMIN';
        } else {
            toggleViewBtn.textContent = 'CAMBIAR A VISTA CLIENTE';
        }
    });
    
    // --- Event Listeners Init ---
    startBtn.addEventListener('click', () => {
        welcomeScreen.classList.remove('active');
        mainScreen.classList.add('active');
        
        // Iniciar cámara web
        if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => { webcamFeed.srcObject = stream; })
                .catch(err => console.log("Cámara no disponible", err));
        }
        
        updateUI();
        
        // Simular algunos autos iniciales
        addCarToQueue();
        setTimeout(addCarToQueue, 1500);
    });
    
    addCarBtn.addEventListener('click', addCarToQueue);
});
