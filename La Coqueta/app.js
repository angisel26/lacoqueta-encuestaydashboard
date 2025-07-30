document.addEventListener('DOMContentLoaded', () => {
    // --- CONSTANTES Y VARIABLES GLOBALES ---
    const ADMIN_PIN = "1234";
    const MAX_VALORES_CHECKBOXES = 3;
    const RESPONSES_KEY = 'coqueta_responses';
    const RAFFLE_CONFIG_KEY = 'coqueta_raffle_config';
    let currentStep = 1;
    let countdownInterval;

    // Vistas principales y secciones
    const surveyView = document.getElementById('survey-view');
    const successView = document.getElementById('success-view');
    const dashboardView = document.getElementById('dashboard-view');
    const surveySections = document.querySelectorAll('.survey-section');
    const totalSteps = surveySections.length;
    
    // Formulario y elementos interactivos
    const form = document.getElementById('coqueta-form');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const valoresCheckboxes = document.querySelectorAll('input[name="valores"]');
    
    // Botones de navegación
    const nextButtons = document.querySelectorAll('.next-btn');
    const prevButtons = document.querySelectorAll('.prev-btn');

    // Modal de Admin y elementos flotantes
    const adminModal = document.getElementById('admin-login-modal');
    const pinInputs = document.querySelectorAll('#pin-inputs input');
    const pinError = document.getElementById('pin-error');
    const surveyHearts = document.getElementById('survey-hearts');
    const dashboardIcons = document.getElementById('dashboard-icons');

    // Elemento del conteo
    const countdownElement = document.getElementById('countdown');

    // --- LÓGICA DE NAVEGACIÓN MULTISTEP ---
    const showStep = (step) => {
        surveySections.forEach(section => section.classList.add('hidden'));
        document.querySelector(`.survey-section[data-step="${step}"]`)?.classList.remove('hidden');
        updateProgressBar();
    };

    const updateProgressBar = () => {
        const progress = Math.round(((currentStep - 1) / (totalSteps - 1)) * 100);
        progressBar.style.width = `${progress}%`;
        progressText.innerText = `${progress}%`;
    };

    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentStep < totalSteps) {
                currentStep++;
                showStep(currentStep);
                window.scrollTo(0, 0);
            }
        });
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                showStep(currentStep);
                window.scrollTo(0, 0);
            }
        });
    });
    
    showStep(currentStep);

    // --- PERSISTENCIA DE DATOS ---

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const response = {
            id: `resp_${Date.now()}`,
            timestamp: new Date().toISOString(),
        };

        // Procesar checkboxes que pueden tener múltiples valores
        response.estilo = formData.getAll('estilo');
        response.valores = formData.getAll('valores');

        // Procesar el resto de los campos
        for (let [key, value] of formData.entries()) {
            if (key !== 'estilo' && key !== 'valores') {
                response[key] = value;
            }
        }

        // Guardar en localStorage
        const allResponses = JSON.parse(localStorage.getItem(RESPONSES_KEY)) || [];
        allResponses.push(response);
        localStorage.setItem(RESPONSES_KEY, JSON.stringify(allResponses));

        console.log("Respuesta guardada:", response);
        
        // Cambiar de vista y activar conteo
        surveyView.classList.add('hidden');
        successView.classList.remove('hidden');
        startCountdown();
        window.scrollTo(0, 0);
    });
    
    // --- LÓGICA DEL SORTEO Y CONTEO ---
    
    const startCountdown = () => {
        clearInterval(countdownInterval); // Limpiar cualquier conteo anterior

        const raffleConfig = JSON.parse(localStorage.getItem(RAFFLE_CONFIG_KEY)) || {};
        const raffleDate = raffleConfig.date ? new Date(raffleConfig.date) : new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000); // Por defecto: 10 días desde ahora

        if (!raffleConfig.date) {
            // Guardar la fecha por defecto si no existe
             localStorage.setItem(RAFFLE_CONFIG_KEY, JSON.stringify({ ...raffleConfig, date: raffleDate.toISOString() }));
        }

        countdownInterval = setInterval(() => {
            const now = new Date().getTime();
            const distance = raffleDate - now;

            if (distance < 0) {
                clearInterval(countdownInterval);
                countdownElement.innerHTML = "¡El sorteo ha finalizado!";
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            countdownElement.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }, 1000);
    };

    // --- LÓGICA RESTANTE (SIN CAMBIOS IMPORTANTES) ---
    
    valoresCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const checkedCount = document.querySelectorAll('input[name="valores"]:checked').length;
            if (checkedCount >= MAX_VALORES_CHECKBOXES) {
                valoresCheckboxes.forEach(cb => {
                    if (!cb.checked) {
                        cb.disabled = true;
                        cb.closest('label').classList.add('opacity-50', 'cursor-not-allowed');
                    }
                });
            } else {
                valoresCheckboxes.forEach(cb => {
                    cb.disabled = false;
                    cb.closest('label').classList.remove('opacity-50', 'cursor-not-allowed');
                });
            }
        });
    });

    pinInputs.forEach((input, index) => {
        input.addEventListener('keyup', (e) => {
            if (e.key >= 0 && e.key <= 9 && index < pinInputs.length - 1) pinInputs[index + 1].focus();
            if (e.key === "Backspace" && index > 0) pinInputs[index - 1].focus();
        });
    });

    window.showAdminLogin = () => {
        adminModal.classList.remove('hidden');
        pinInputs[0].focus();
    };

    window.closeAdminLogin = () => {
        adminModal.classList.add('hidden');
        pinError.classList.add('hidden');
        pinInputs.forEach(input => input.value = '');
    };

    window.verifyAdminPin = () => {
        const enteredPin = Array.from(pinInputs).map(input => input.value).join('');
        if (enteredPin === ADMIN_PIN) {
            surveyView.classList.add('hidden');
            successView.classList.add('hidden');
            dashboardView.classList.remove('hidden');
            surveyHearts.classList.add('hidden');
            dashboardIcons.classList.remove('hidden');
            closeAdminLogin();
            window.scrollTo(0, 0);
            // En el futuro, aquí llamaremos a la función que carga el dashboard
        } else {
            pinError.classList.add('hidden');
            pinInputs.forEach(input => input.value = '');
            pinInputs[0].focus();
        }
    };
    
    window.exitDashboard = () => {
        dashboardView.classList.add('hidden');
        surveyView.classList.remove('hidden');
        dashboardIcons.classList.add('hidden');
        surveyHearts.classList.remove('hidden');
        window.scrollTo(0, 0);
    };

    window.resetSurvey = () => {
        successView.classList.add('hidden');
        surveyView.classList.remove('hidden');
        form.reset();
        currentStep = 1;
        showStep(currentStep);
        clearInterval(countdownInterval);
        valoresCheckboxes.forEach(cb => {
            cb.disabled = false;
            cb.closest('label').classList.remove('opacity-50', 'cursor-not-allowed');
        });
    };
});
