document.addEventListener('DOMContentLoaded', () => {
    // --- CONSTANTES Y VARIABLES GLOBALES ---
    const ADMIN_PIN = "1234";
    const MAX_VALORES_CHECKBOXES = 3;
    const RESPONSES_KEY = 'coqueta_responses';
    const RAFFLE_CONFIG_KEY = 'coqueta_raffle_config';
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
    const countdownElement = document.getElementById('countdown');
    const raffleDateInput = document.getElementById('raffle-date');
    const couponValueInput = document.getElementById('coupon-value');

    // --- LÓGICA DEL DASHBOARD ---
    const renderDashboard = () => {
        const responses = JSON.parse(localStorage.getItem(RESPONSES_KEY)) || [];
        
        // Renderizar Métricas
        document.getElementById('metric-total').innerText = responses.length;
        const calcPercentage = (filterFn) => {
            if (responses.length === 0) return '0%';
            const count = responses.filter(filterFn).length;
            return `${Math.round((count / responses.length) * 100)}%`;
        };
        document.getElementById('metric-asesoria').innerText = calcPercentage(r => r['asesoria-previa'] === 'no-encantaria');
        document.getElementById('metric-precio').innerText = calcPercentage(r => r.precio === '>60');
        document.getElementById('metric-piloto').innerText = calcPercentage(r => r['participar-piloto'] === 'si');

        // Renderizar Gráficos
        renderAgeChart(responses);
        renderSeguridadChart(responses);
        renderValoresChart(responses);
    };

    const renderChart = (chartId, type, data, options) => {
        if (chartInstances[chartId]) chartInstances[chartId].destroy();
        const ctx = document.getElementById(chartId).getContext('2d');
        chartInstances[chartId] = new Chart(ctx, { type, data, options });
    };

    const renderAgeChart = (responses) => {
        const ageCounts = responses.reduce((acc, r) => { acc[r.edad] = (acc[r.edad] || 0) + 1; return acc; }, {});
        renderChart('age-chart', 'doughnut', {
            labels: Object.keys(ageCounts),
            datasets: [{ data: Object.values(ageCounts), backgroundColor: ['#ec4899', '#be185d', '#a21caf', '#7c3aed', '#5b21b6'], hoverOffset: 4 }]
        }, { responsive: true, plugins: { legend: { position: 'bottom' } } });
    };
    
    const renderSeguridadChart = (responses) => {
        const labels = { 'si': 'Sí, segura', 'mas-menos': 'Más o menos', 'no': 'No, me cuesta' };
        const counts = responses.reduce((acc, r) => { const label = labels[r.seguridad] || 'No responde'; acc[label] = (acc[label] || 0) + 1; return acc; }, {});
        renderChart('seguridad-chart', 'bar', {
            labels: Object.keys(counts),
            datasets: [{ data: Object.values(counts), backgroundColor: ['#10b981', '#f59e0b', '#ef4444'], borderRadius: 8 }]
        }, { responsive: true, plugins: { legend: { display: false } } });
    };

    const renderValoresChart = (responses) => {
        const labels = { "quede-bien": "Quede bien", "resalte-figura": "Resalte figura", "calidad": "Calidad", "moda": "Moda", "asesoren": "Asesoría", "combine": "Combine", "sentir-segura": "Sentir segura", "servicio-personalizado": "Servicio personalizado" };
        const counts = responses.flatMap(r => r.valores || []).reduce((acc, v) => { const label = labels[v] || v; acc[label] = (acc[label] || 0) + 1; return acc; }, {});
        renderChart('valores-chart', 'bar', {
            labels: Object.keys(counts),
            datasets: [{ data: Object.values(counts), backgroundColor: ['#ec4899', '#be185d', '#a21caf', '#7c3aed', '#5b21b6', '#ec4899', '#be185d', '#a21caf'], borderRadius: 6 }]
        }, { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } } });
    };

    // --- LÓGICA DE NAVEGACIÓN Y FORMULARIO ---
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
    nextButtons.forEach(button => button.addEventListener('click', () => { if (currentStep < totalSteps) { currentStep++; showStep(currentStep); window.scrollTo(0, 0); }}));
    prevButtons.forEach(button => button.addEventListener('click', () => { if (currentStep > 1) { currentStep--; showStep(currentStep); window.scrollTo(0, 0); }}));
    showStep(currentStep);
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const response = { id: `resp_${Date.now()}`, timestamp: new Date().toISOString() };
        response.estilo = formData.getAll('estilo');
        response.valores = formData.getAll('valores');
        for (let [key, value] of formData.entries()) { if (key !== 'estilo' && key !== 'valores') response[key] = value; }
        const allResponses = JSON.parse(localStorage.getItem(RESPONSES_KEY)) || [];
        allResponses.push(response);
        localStorage.setItem(RESPONSES_KEY, JSON.stringify(allResponses));
        surveyView.classList.add('hidden');
        successView.classList.remove('hidden');
        startCountdown();
        window.scrollTo(0, 0);
    });
    
    // --- LÓGICA DEL SORTEO Y CONTEO ---
    const startCountdown = () => {
        clearInterval(countdownInterval);
        const raffleConfig = JSON.parse(localStorage.getItem(RAFFLE_CONFIG_KEY)) || {};
        const raffleDate = raffleConfig.date ? new Date(raffleConfig.date) : new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000);
        if (!raffleConfig.date) localStorage.setItem(RAFFLE_CONFIG_KEY, JSON.stringify({ ...raffleConfig, date: raffleDate.toISOString() }));
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
        localStorage.setItem(RAFFLE_CONFIG_KEY, JSON.stringify(config));
        alert('Configuración del sorteo guardada.');
    };
    
    // --- LÓGICA DE ADMIN Y ACCIONES RÁPIDAS ---
    window.verifyAdminPin = () => {
        if (Array.from(pinInputs).map(i => i.value).join('') === ADMIN_PIN) {
            surveyView.classList.add('hidden'); successView.classList.add('hidden'); dashboardView.classList.remove('hidden');
            renderDashboard(); closeAdminLogin(); window.scrollTo(0, 0);
        } else {
            pinError.classList.remove('hidden'); pinInputs.forEach(input => input.value = ''); pinInputs[0].focus();
        }
    };
    window.clearData = () => { if (confirm('¿Estás seguro de que quieres borrar TODAS las respuestas?')) { localStorage.removeItem(RESPONSES_KEY); renderDashboard(); alert('Datos eliminados.'); }};
    window.updateDashboard = () => renderDashboard();
    window.exportData = () => {
        const data = localStorage.getItem(RESPONSES_KEY);
        const blob = new Blob([data || "[]"], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'coqueta_responses.json';
        a.click();
        URL.revokeObjectURL(url);
    };
    window.sendReport = () => alert('Función no implementada. Esto simula el envío de un reporte por email.');
    window.showAdminLogin = () => adminModal.classList.remove('hidden');
    window.closeAdminLogin = () => adminModal.classList.add('hidden');
    window.exitDashboard = () => { dashboardView.classList.add('hidden'); surveyView.classList.remove('hidden'); };
    window.resetSurvey = () => { form.reset(); currentStep = 1; showStep(1); successView.classList.add('hidden'); surveyView.classList.remove('hidden'); clearInterval(countdownInterval); };
});
