document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN DE SERVICIOS ---
    const SUPABASE_URL = 'https://iijnuxziaftelvowmorg.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpam51eHppYWZ0ZWx2b3dtb3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDk2OTAsImV4cCI6MjA2OTQ4NTY5MH0.vlnPdApENWEx2-ayNTtGpEqu7DcPS6_VYHOK--cVi0o';
    const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    const EMAILJS_SERVICE_ID = 'service_sqsuzmb';
    const EMAILJS_TEMPLATE_ID = 'template_100rn4i';
    const EMAILJS_PUBLIC_KEY = 'uhY_-nt1o5IjmpeVn';

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
    const surveyHearts = document.getElementById('survey-hearts');
    const dashboardIcons = document.getElementById('dashboard-icons');

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
        document.getElementById('metric-asesoria').innerText = calcPercentage(r => r.asesoria_gratuita === 'si');
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
            if (input.type === 'radio' || input.type === 'checkbox') {
                const name = input.name;
                if (!form.querySelector(`input[name="${name}"]:checked`)) { allValid = false; break; }
            } else { if (!input.value.trim()) { allValid = false; break; } }
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
            if (radio.value === 'otra' && radio.checked) { otraOcupacionInput.classList.remove('hidden'); otraOcupacionInput.required = true; } 
            else { otraOcupacionInput.classList.add('hidden'); otraOcupacionInput.required = false; }
        });
    });
    valoresCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const checkedCount = document.querySelectorAll('input[name="valores"]:checked').length;
            if (checkedCount >= MAX_VALORES_CHECKBOXES) { valoresCheckboxes.forEach(cb => { if (!cb.checked) cb.disabled = true; }); } 
            else { valoresCheckboxes.forEach(cb => { cb.disabled = false; }); }
        });
    });
    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                if (currentStep < totalSteps) { currentStep++; showStep(currentStep); window.scrollTo(0, 0); }
            } else { alert('Por favor, completa todos los campos marcados con (*) para continuar.'); }
        });
    });
    prevButtons.forEach(button => button.addEventListener('click', () => { if (currentStep > 1) { currentStep--; showStep(currentStep); window.scrollTo(0, 0); }}));
    showStep(currentStep);
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateStep(currentStep)) { alert('Por favor, completa todos los campos marcados con (*) para continuar.'); return; }
        const formData = new FormData(form);
        const responseData = Object.fromEntries(formData.entries());
        responseData.estilo = formData.getAll('estilo');
        responseData.valores = formData.getAll('valores');
        if (responseData.ocupacion !== 'otra') { responseData.ocupacion_otra = null; }
        
        const { error } = await db.from('respuestas').insert([responseData]);
        if (error) {
            console.error('Error guardando en Supabase:', error);
            alert('Hubo un error al guardar tu respuesta. Por favor, intenta de nuevo.');
        } else {
            console.log('Respuesta guardada en Supabase con éxito.');
            try {
                const raffleConfig = JSON.parse(localStorage.getItem('coqueta_raffle_config')) || {};
                const raffleDate = raffleConfig.date ? new Date(raffleConfig.date) : new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000);
                const distance = raffleDate - new Date().getTime();
                const templateParams = {
                    to_name: responseData.nombre,
                    to_email: responseData.correo,
                    countdown_days: Math.floor(distance / (1000 * 60 * 60 * 24)),
