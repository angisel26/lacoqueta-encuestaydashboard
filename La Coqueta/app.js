document.addEventListener('DOMContentLoaded', () => {
    // --- CONSTANTES Y VARIABLES GLOBALES ---
    const ADMIN_PIN = "1234";
    const MAX_VALORES_CHECKBOXES = 3;
    let currentStep = 1;

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

    // --- LÓGICA DE NAVEGACIÓN MULTISTEP ---

    const showStep = (step) => {
        surveySections.forEach(section => {
            section.classList.add('hidden');
        });
        const activeSection = document.querySelector(`.survey-section[data-step="${step}"]`);
        if (activeSection) {
            activeSection.classList.remove('hidden');
        }
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
    
    // Inicializar la primera vista
    showStep(currentStep);

    // --- LÓGICA DE LA ENCUESTA ---

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

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        // Lógica futura para guardar datos...
        console.log("Formulario enviado. Guardando datos...");
        
        surveyView.classList.add('hidden');
        successView.classList.remove('hidden');
        window.scrollTo(0, 0);
    });

    // --- LÓGICA DEL ADMIN ---
    
    pinInputs.forEach((input, index) => {
        input.addEventListener('keyup', (e) => {
            if (e.key >= 0 && e.key <= 9 && index < pinInputs.length - 1) {
                pinInputs[index + 1].focus();
            }
            if (e.key === "Backspace" && index > 0) {
                pinInputs[index - 1].focus();
            }
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
             // Lógica futura para cargar el dashboard...
        } else {
            pinError.classList.remove('hidden');
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
        valoresCheckboxes.forEach(cb => {
            cb.disabled = false;
            cb.closest('label').classList.remove('opacity-50', 'cursor-not-allowed');
        });
    };
});
