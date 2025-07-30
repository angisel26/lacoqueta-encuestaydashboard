document.addEventListener('DOMContentLoaded', () => {
    // --- CONSTANTES Y VARIABLES GLOBALES ---
    const ADMIN_PIN = "1234"; // PIN por defecto
    const MAX_VALORES_CHECKBOXES = 3;

    // Vistas principales
    const surveyView = document.getElementById('survey-view');
    const successView = document.getElementById('success-view');
    const dashboardView = document.getElementById('dashboard-view');
    const surveyHearts = document.getElementById('survey-hearts');
    const dashboardIcons = document.getElementById('dashboard-icons');
    
    // Formulario y elementos interactivos
    const form = document.getElementById('coqueta-form');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const valoresCheckboxes = document.querySelectorAll('#valores-checkboxes input[type="checkbox"]');
    
    // Modal de Admin
    const adminModal = document.getElementById('admin-login-modal');
    const pinInputs = document.querySelectorAll('#pin-inputs input');
    const pinError = document.getElementById('pin-error');

    // --- LÓGICA DE LA ENCUESTA ---

    // 1. Actualizar la barra de progreso
    const totalQuestions = form.querySelectorAll('.mb-6').length; // Una forma de contar las preguntas
    form.addEventListener('change', () => {
        const answeredQuestions = new Set();
        const formData = new FormData(form);
        
        for (let [name] of formData.entries()) {
            answeredQuestions.add(name);
        }
        
        const progress = Math.min(100, Math.round((answeredQuestions.size / totalQuestions) * 100));
        progressBar.style.width = `${progress}%`;
        progressText.innerText = `${progress}%`;
    });

    // 2. Limitar selección de checkboxes "valores"
    valoresCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const checkedCount = document.querySelectorAll('#valores-checkboxes input[type="checkbox"]:checked').length;
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

    // 3. Manejo del envío del formulario
    form.addEventListener('submit', (e) => {
        e.preventDefault(); // Evita que la página se recargue
        console.log('Formulario enviado. Procesando datos...');
        
        // Aquí iría la lógica para guardar los datos en localStorage
        // que implementaremos a continuación.

        // Cambiar a la vista de éxito
        surveyView.classList.add('hidden');
        successView.classList.remove('hidden');
        window.scrollTo(0, 0); // Sube al inicio de la página
    });

    // --- LÓGICA DEL ADMIN ---
    
    // 4. Lógica del modal de PIN
    pinInputs.forEach((input, index) => {
        input.addEventListener('keyup', (e) => {
            // Mover al siguiente input automáticamente
            if (e.key >= 0 && e.key <= 9 && index < pinInputs.length - 1) {
                pinInputs[index + 1].focus();
            }
            // Borrar y mover al anterior
            if (e.key === "Backspace" && index > 0) {
                pinInputs[index - 1].focus();
            }
        });
    });

    // --- FUNCIONES GLOBALES (para los botones `onclick`) ---
    
    window.showAdminLogin = () => {
        adminModal.classList.remove('hidden');
        pinInputs[0].focus();
    };

    window.closeAdminLogin = () => {
        adminModal.classList.add('hidden');
        pinError.classList.add('hidden');
        pinInputs.forEach(input => input.value = ''); // Limpiar PIN
    };

    window.verifyAdminPin = () => {
        const enteredPin = Array.from(pinInputs).map(input => input.value).join('');
        if (enteredPin === ADMIN_PIN) {
            // PIN correcto: cambiar a la vista de dashboard
            surveyView.classList.add('hidden');
            successView.classList.add('hidden');
            dashboardView.classList.remove('hidden');
            surveyHearts.classList.add('hidden');
            dashboardIcons.classList.remove('hidden');
            closeAdminLogin();
            window.scrollTo(0, 0);
            
            // Aquí llamaríamos a la función para cargar los datos del dashboard
            // que implementaremos más adelante.
        } else {
            // PIN incorrecto
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
        form.reset(); // Limpiar el formulario
        // Resetear progreso y checkboxes
        progressBar.style.width = '0%';
        progressText.innerText = '0%';
        valoresCheckboxes.forEach(cb => {
            cb.disabled = false;
            cb.closest('label').classList.remove('opacity-50', 'cursor-not-allowed');
        });
    };
});