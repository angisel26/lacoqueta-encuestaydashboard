document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN DE SUPABASE ---
    const SUPABASE_URL = 'https://iijnuxziaftelvowmorg.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpam51eHppYWZ0ZWx2b3dtb3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDk2OTAsImV4cCI6MjA2OTQ4NTY5MH0.vlnPdApENWEx2-ayNTtGpEqu7DcPS6_VYHOK--cVi0o';
    const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // --- CONSTANTES Y VARIABLES GLOBALES ---
    const ADMIN_PIN = "1234";
    const MAX_VALORES_CHECKBOXES = 3;
    let currentStep = 1;
    let countdownInterval;
    let chartInstances = {};

    // Elementos de la UI
    const surveyView = document.getElementById('survey-view');
    const successView = document.getElementById('success-view');
    const dashboardView = document.getElementById('dashboard-view');
    const surveySections = document.querySelectorAll('.survey-section');
    const totalSteps = surveySections.length;
    const form = document.getElementById('coqueta-form');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const valoresCheckboxes = document.querySelectorAll('input[name="valores"]');
    const nextButtons = document.querySelectorAll('.next-btn');
    const prevButtons = document.querySelectorAll('.prev-btn');
    const adminModal = document.getElementById('admin-login-modal');
    const pinInputs = document.querySelectorAll('#pin-inputs input');
    const pinError = document.getElementById('pin-error');
    const adminBtn = document.getElementById('admin-btn');
    const countdownElement = document.getElementById('countdown');
    const raffleDateInput = document.getElementById('raffle-date');
    const couponValueInput = document.getElementById('coupon-value');
    const ocupacionRadios = document.querySelectorAll('input[name="ocupacion"]');
    const otraOcupacionInput = document.getElementById('ocupacion-otra-input');

    // --- LÓGICA DEL DASHBOARD ---
    const renderDashboard = async () => {
        const { data: responses, error } = await db.from('respuestas').select('*');
        if (error) { console.error("Error al cargar los datos:", error); return; }
        document.getElementById('metric-total').innerText = responses.length;
        const calcPercentage = (filterFn) => {
            if (responses.length === 0) return '0%';
            const count = responses.filter(filterFn).length;
            return `${Math.round((count / responses.length) * 100)}%`;
        };
        document.getElementById('metric-asesoria').innerText = calcPercentage(r => r['asesoria_previa'] === 'no-encantaria');
        document.getElementById('metric-precio').innerText = calcPercentage(r => r.precio === '>60');
        document.getElementById('metric-piloto').innerText = calcPercentage(r => r['participar_piloto'] === 'si');
        renderAgeChart(responses);
        renderSeguridadChart(responses);
        renderValoresChart(responses);
        renderMarcasChart(responses);
    };
    const renderChart = (chartId, type, data, options) => {
        if (chartInstances[chartId]) chartInstances[chartId].destroy();
        const ctx = document.getElementById(chartId)?.getContext('2d');
        if (ctx) chartInstances[chartId] = new Chart(ctx, { type, data, options });
    };
    const renderAgeChart = (responses) => {
        const counts = responses.reduce((acc, r) => { acc[r.edad] = (acc[r.edad] || 0) + 1; return acc; }, {});
        renderChart('age-chart', 'doughnut', { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: ['#ec4899', '#be185d', '#a21caf', '#7c3aed', '#5b21b6'], hoverOffset: 4 }] }, { responsive: true, plugins: { legend: { position: 'bottom' } } });
    };
    const renderSeguridadChart = (responses) => {
        const labels = { 'si': 'Sí, segura', 'mas-menos': 'Más o menos', 'no': 'No, me cuesta' };
        const counts = responses.reduce((acc, r) => { const label = labels[r.seguridad] || 'No responde'; acc[label] = (acc[label] || 0) + 1; return acc; }, {});
        renderChart('seguridad-chart', 'bar', { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: ['#10b981', '#f59e0b', '#ef4444'], borderRadius: 8 }] }, { responsive: true, plugins: { legend: { display: false } } });
    };
    const renderValoresChart = (responses) => {
        const labels = { "quede-bien": "Quede bien", "resalte-figura": "Resalte figura", "calidad": "Calidad", "moda": "Moda", "asesoren": "Asesoría", "combine": "Combine", "sentir-segura": "Sentir segura", "servicio-personalizado": "Servicio personalizado" };
        const counts = (responses.flatMap(r => r.valores).filter(Boolean)).reduce((acc, v) => { const label = labels[v] || v; acc[label] = (acc[label] || 0) + 1; return acc; }, {});
        renderChart('valores-chart', 'bar', { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: ['#ec4899', '#be185d', '#a21caf', '#7c3aed', '#5b21b6', '#ec4899', '#be185d', '#a21caf'], borderRadius: 6 }] }, { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } } });
    };
    const renderMarcasChart = (responses) => {
        const labels = { 'nacional': 'Nacionales', 'importada': 'Importadas' };
        const counts = responses.reduce((acc, r) => { const label = labels[r.marcas] || 'No responde'; acc[label] = (acc[label] || 0) + 1; return acc; }, {});
        renderChart('marcas-chart', 'doughnut', { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: ['#ec4899', '#7c3aed'], hoverOffset: 4 }] }, { responsive: true, plugins: { legend: { position: 'bottom' } } });
    };

    // --- LÓGICA DE NAVEGACIÓN Y VALIDACIÓN ---
    const validateStep = (stepNumber) => {
        const currentSection = document.querySelector(`.survey-section[data-step="${stepNumber}"]`);
        const inputs = currentSection.querySelectorAll('input[required], select[required], textarea[required]');
        let allValid = true;

        for (const input of inputs) {
            // Para radio y checkbox, verifica que al menos uno en su grupo esté seleccionado
            if (input.type === 'radio' || input.type === 'checkbox') {
                const name = input.name;
                if (!form.querySelector(`input[name="${name}"]:checked`)) {
                    allValid = false;
                    break; // Sal del bucle si encuentras un grupo no válido
                }
            } else { // Para otros inputs (text, email, tel)
                if (!input.value.trim()) {
                    allValid = false;
                    break; // Sal del bucle si encuentras un input vacío
                }
            }
        }
        return allValid;
    };

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
    
    ocupacionRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'otra' && radio.checked) {
                otraOcupacionInput.classList.remove('hidden');
                otraOcupacionInput.required = true;
            } else {
                otraOcupacionInput.classList.add('hidden');
                otraOcupacionInput.required = false;
            }
        });
    });

    valoresCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const checkedCount = document.querySelectorAll('input[name="valores"]:checked').length;
            if (checkedCount >= MAX_VALORES_CHECKBOXES) {
                valoresCheckboxes.forEach(cb => { if (!cb.checked) cb.disabled = true; });
            } else {
                valoresCheckboxes.forEach(cb => { cb.disabled = false; });
            }
        });
    });

    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                if (currentStep < totalSteps) {
                    currentStep++;
                    showStep(currentStep);
                    window.scrollTo(0, 0);
                }
            } else {
                alert('Por favor, completa todos los campos marcados con (*) para continuar.');
            }
        });
    });

    prevButtons.forEach(button => button.addEventListener('click', () => { if (currentStep > 1) { currentStep--; showStep(currentStep); window.scrollTo(0, 0); }}));
    showStep(currentStep);
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateStep(currentStep)) {
            alert('Por favor, completa todos los campos marcados con (*) para continuar.');
            return;
        }

        const formData = new FormData(form);
        const responseData = Object.fromEntries(formData.entries());
        responseData.estilo = formData.getAll('estilo');
        responseData.valores = formData.getAll('valores');
        if(responseData.ocupacion !== 'otra') { responseData.ocupacion_otra = null; }

        const { error } = await db.from('respuestas').insert([responseData]);
        if (error) {
            console.error('Error guardando en Supabase:', error);
            alert('Hubo un error al guardar tu respuesta. Por favor, intenta de nuevo.');
        } else {
            surveyView.classList.add('hidden');
            successView.classList.remove('hidden');
            startCountdown();
            window.scrollTo(0, 0);
        }
    });
    
    // --- LÓGICA DEL SORTEO, ADMIN Y ACCIONES RÁPIDAS (sin cambios) ---
    const startCountdown = () => {
        clearInterval(countdownInterval);
        const raffleConfig = JSON.parse(localStorage.getItem('coqueta_raffle_config')) || {};
        const raffleDate = raffleConfig.date ? new Date(raffleConfig.date) : new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000);
        if (!raffleConfig.date) localStorage.setItem('coqueta_raffle_config', JSON.stringify({ ...raffleConfig, date: raffleDate.toISOString() }));
        countdownInterval = setInterval(() => {
            const distance = raffleDate - new Date().getTime();
            if (distance < 0) { clearInterval(countdownInterval); countdownElement.innerHTML = "¡El sorteo ha finalizado!"; return; }
            const d = Math.floor(distance / (1000 * 60 * 60 * 24));
            const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((distance % (1000 * 60)) / 1000);
            countdownElement.innerHTML = `${d}d ${h}h ${m}m ${s}s`;
        }, 1000);
    };
    window.saveRaffleConfig = () => {
        const config = { date: raffleDateInput.value, couponValue: couponValueInput.value };
        localStorage.setItem('coqueta_raffle_config', JSON.stringify(config));
        alert('Configuración del sorteo guardada.');
    };
    window.verifyAdminPin = () => {
        if (Array.from(pinInputs).map(i => i.value).join('') === ADMIN_PIN) {
            adminBtn.classList.add('hidden');
            surveyView.classList.add('hidden'); successView.classList.add('hidden'); dashboardView.classList.remove('hidden');
            renderDashboard(); closeAdminLogin(); window.scrollTo(0, 0);
            pinInputs.forEach(input => input.value = '');
        } else {
            pinError.classList.remove('hidden'); pinInputs.forEach(input => input.value = ''); pinInputs[0].focus();
        }
    };
    window.clearData = async () => { if (confirm('¿Estás seguro de que quieres borrar TODAS las respuestas de la nube? Esta acción no se puede deshacer.')) { const { error } = await db.from('respuestas').delete().neq('id', 0); if (error) console.error("Error borrando datos:", error); else renderDashboard();}};
    window.updateDashboard = () => renderDashboard();
    window.exportData = async () => {
        const { data: responses, error } = await db.from('respuestas').select('*');
        if (error || !responses || responses.length === 0) { alert("No hay datos para exportar."); return; }
        const headers = Object.keys(responses[0]);
        let csvContent = headers.join(',') + '\n';
        responses.forEach(response => {
            const row = headers.map(header => {
                let cell = response[header] === null || response[header] === undefined ? '' : response[header];
                if (Array.isArray(cell)) cell = cell.join('; ');
                return `"${String(cell).replace(/"/g, '""')}"`;
            }).join(',');
            csvContent += row + '\n';
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'coqueta_responses.csv';
        a.click();
        URL.revokeObjectURL(url);
    };
    window.sendReport = () => alert('Función no implementada. Esto simula el envío de un reporte por email.');
    window.showAdminLogin = () => adminModal.classList.remove('hidden');
    window.closeAdminLogin = () => adminModal.classList.add('hidden');
    window.exitDashboard = () => { dashboardView.classList.add('hidden'); surveyView.classList.remove('hidden'); adminBtn.classList.remove('hidden'); };
    window.resetSurvey = () => { form.reset(); currentStep = 1; showStep(1); successView.classList.add('hidden'); surveyView.classList.remove('hidden'); clearInterval(countdownInterval); };
});
