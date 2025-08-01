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
    // ... (otras variables)
    
    // --- ELEMENTOS DE LA UI (Añadimos los nuevos) ---
    const adminMainView = document.getElementById('admin-main-view');
    const tabBi = document.getElementById('tab-bi');
    const tabDss = document.getElementById('tab-dss');
    const dashboardView = document.getElementById('dashboard-view');
    const matrixView = document.getElementById('matrix-view');
    const matrixInputs = document.querySelectorAll('#matrix-view input[type="number"]');

    // ... (resto de selectores de elementos de la UI)

    // --- INICIO: LÓGICA DE NAVEGACIÓN POR PESTAÑAS (BI/DSS) ---
    tabBi.addEventListener('click', () => {
        tabBi.classList.add('active');
        tabDss.classList.remove('active');
        dashboardView.classList.remove('hidden');
        matrixView.classList.add('hidden');
    });

    tabDss.addEventListener('click', () => {
        tabDss.classList.add('active');
        tabBi.classList.remove('active');
        matrixView.classList.remove('hidden');
        dashboardView.classList.add('hidden');
    });
    // --- FIN: LÓGICA DE NAVEGACIÓN POR PESTAÑAS ---


    // --- INICIO: LÓGICA DE LA MATRIZ DE DECISIÓN (DSS) ---
    const calculateMatrix = () => {
        const weights = { c1: 0.40, c2: 0.30, c3: 0.20, c4: 0.10 };

        const getScore = (option, criterion) => {
            const value = document.getElementById(`score-${option}-${criterion}`).value;
            return parseFloat(value) || 0;
        };

        const scoreA = (getScore('a', 'c1') * weights.c1) + (getScore('a', 'c2') * weights.c2) + (getScore('a', 'c3') * weights.c3) + (getScore('a', 'c4') * weights.c4);
        const scoreB = (getScore('b', 'c1') * weights.c1) + (getScore('b', 'c2') * weights.c2) + (getScore('b', 'c3') * weights.c3) + (getScore('b', 'c4') * weights.c4);
        const scoreC = (getScore('c', 'c1') * weights.c1) + (getScore('c', 'c2') * weights.c2) + (getScore('c', 'c3') * weights.c3) + (getScore('c', 'c4') * weights.c4);

        document.getElementById('result-a').innerText = scoreA.toFixed(2);
        document.getElementById('result-b').innerText = scoreB.toFixed(2);
        document.getElementById('result-c').innerText = scoreC.toFixed(2);

        const recommendationEl = document.getElementById('recommendation');
        const scores = [ { name: 'Opción A: Marcas Nacionales', score: scoreA }, { name: 'Opción B: Modelo Híbrido', score: scoreB }, { name: 'Opción C: Marcas Importadas', score: scoreC } ];
        
        // Filtrar para evitar recomendar si todo es 0
        const validScores = scores.filter(s => s.score > 0);
        if (validScores.length === 0) {
            recommendationEl.innerText = "Introduce las puntuaciones para ver una recomendación.";
            return;
        }

        const bestOption = validScores.reduce((max, current) => current.score > max.score ? current : max);
        recommendationEl.innerText = `La estrategia recomendada es: ${bestOption.name}`;
    };

    matrixInputs.forEach(input => {
        input.addEventListener('input', calculateMatrix);
    });
    // --- FIN: LÓGICA DE LA MATRIZ DE DECISIÓN ---


    // --- LÓGICA DEL DASHBOARD (BI) ---
    // ... (Todas las funciones renderDashboard, renderChart, etc. no cambian)


    // --- LÓGICA DE NAVEGACIÓN Y FORMULARIO ---
    // ... (Todas las funciones validateStep, showStep, etc. no cambian)


    // --- LÓGICA DE ADMIN Y ACCIONES RÁPIDAS (con pequeño ajuste) ---
    window.verifyAdminPin = () => {
        if (Array.from(pinInputs).map(i => i.value).join('') === ADMIN_PIN) {
            // Se cambia a la nueva vista principal de admin
            adminMainView.classList.remove('hidden'); 
            // El resto de la lógica de ocultar/mostrar se mantiene
            surveyView.classList.add('hidden'); 
            successView.classList.add('hidden');
            renderDashboard(); 
            closeAdminLogin(); 
            // ... etc.
        } else {
            // ...
        }
    };

    window.exitAdminView = () => { // Renombramos la función de salida
        adminMainView.classList.add('hidden');
        surveyView.classList.remove('hidden');
        adminBtn.classList.remove('hidden');
        // ... etc.
    };

    // ... (el resto de las funciones como clearData, exportData, etc. no cambian)
});
