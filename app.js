document.addEventListener('DOMContentLoaded', () => {
    let inventario = JSON.parse(localStorage.getItem('taller_inventario')) || [];
    let idUltimoItemCreado = null;
    const CODIGO_ACTIVACION_VALIDO = "TALLER-LUKS-2026"; 

    // --- ACCESO COMERCIAL ---
    function verificarAcceso() {
        if (localStorage.getItem('luks_app_activada') !== 'true') {
            document.getElementById('inventory-form').style.opacity = "0.1";
            setTimeout(() => {
                let cod = prompt("🔑 Luk's Stock Manager: Ingresá tu código de activación:");
                if (cod === CODIGO_ACTIVACION_VALIDO) {
                    localStorage.setItem('luks_app_activada', 'true');
                    window.location.reload();
                } else {
                    alert("Código incorrecto.");
                }
            }, 500);
        }
    }
    verificarAcceso();

    // --- EFECTOS DE ENFOQUE (FOCUS) ---
    const inputs = document.querySelectorAll('#inventory-form input, #inventory-form textarea, #ia-input');
    inputs.forEach(input => {
        input.addEventListener('focus', (e) => e.target.closest('section').classList.add('seccion-enfocada'));
        input.addEventListener('blur', (e) => e.target.closest('section').classList.remove('seccion-enfocada'));
    });

    // --- RENDERIZADO DE TARJETAS (ACORDEÓN) ---
    function renderInventario(datos = inventario) {
        const list = document.getElementById('inventory-list');
        list.innerHTML = '';

        if (datos.length === 0) {
            list.innerHTML = `<p class="text-center text-[#7c7c8a] py-10 italic text-sm">No se encontraron resultados.</p>`;
            return;
        }

        datos.slice().reverse().forEach(item => { // Lo último cargado aparece primero
            const card = document.createElement('div');
            card.className = `item-card ${item.id === idUltimoItemCreado ? 'animar-fila-nueva' : ''}`;
            
            // Detector de categorías
            let tag = '';
            const desc = (item.descripcion || '').toLowerCase();
            if (['pinza', 'llave', 'tubo', 'martillo', 'mecha'].some(p => desc.includes(p))) {
                tag = `<span class="text-[9px] bg-blue-900/30 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded ml-2">🔧 Herramienta</span>`;
            } else if (['correa', 'bujia', 'filtro', 'reten', 'pastilla'].some(p => desc.includes(p))) {
                tag = `<span class="text-[9px] bg-amber-900/30 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded ml-2">📦 Repuesto</span>`;
            }

            card.innerHTML = `
                <div class="item-header" onclick="this.parentElement.classList.toggle('active')">
                    <div class="flex gap-3 items-center">
                        <span class="bg-emerald-600 text-[#121214] font-bold px-2 py-1 rounded text-sm">${item.cantidad}</span>
                        <div>
                            <p class="text-white text-sm font-medium">${item.descripcion} ${tag}</p>
                            <p class="text-[#7c7c8a] text-[10px]">${item.fecha}</p>
                        </div>
                    </div>
                    <span class="chevron">▼</span>
                </div>
                <div class="item-details">
                    <div class="grid grid-cols-2 gap-y-3 text-xs">
                        <div><p class="text-[#7c7c8a]">Cód. Fábrica</p><p class="text-white font-mono">${item.codigo1 || '-'}</p></div>
                        <div><p class="text-[#7c7c8a]">Cód. Interno</p><p class="text-white font-mono">${item.codigo2 || '-'}</p></div>
                        <div class="col-span-2"><p class="text-[#7c7c8a]">Proveedor</p><p class="text-white">${item.proveedor || '-'}</p></div>
                        <div class="col-span-2"><p class="text-[#7c7c8a]">Observaciones</p><p class="text-[#a8a8b3] italic">${item.observaciones || '-'}</p></div>
                    </div>
                    <div class="mt-4 pt-3 border-t border-[#29292e] flex justify-end">
                        <button onclick="borrarItem(${item.id})" class="text-red-400 text-[11px] font-bold uppercase">Borrar Registro</button>
                    </div>
                </div>`;
            list.appendChild(card);
        });
    }

    // --- BUSCADOR ---
    document.getElementById('search-mobile')?.addEventListener('input', (e) => {
        const busqueda = e.target.value.toLowerCase();
        const filtrados = inventario.filter(i => 
            i.descripcion.toLowerCase().includes(busqueda) || 
            i.codigo1.toLowerCase().includes(busqueda) ||
            i.proveedor.toLowerCase().includes(busqueda)
        );
        renderInventario(filtrados);
    });

    // --- GUARDAR ---
    document.getElementById('inventory-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const nuevo = {
            id: Date.now(),
            fecha: document.getElementById('fecha').value,
            cantidad: document.getElementById('cantidad').value,
            descripcion: document.getElementById('descripcion').value,
            codigo1: document.getElementById('codigo1').value,
            codigo2: document.getElementById('codigo2').value,
            proveedor: document.getElementById('proveedor').value,
            observaciones: document.getElementById('observaciones').value,
            extras: {}
        };
        inventario.push(nuevo);
        localStorage.setItem('taller_inventario', JSON.stringify(inventario));
        idUltimoItemCreado = nuevo.id;
        e.target.reset();
        document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
        renderInventario();
    });

    window.borrarItem = (id) => {
        if(confirm("¿Eliminar?")) {
            inventario = inventario.filter(i => i.id !== id);
            localStorage.setItem('taller_inventario', JSON.stringify(inventario));
            renderInventario();
        }
    };

    // --- ASISTENTE IA (GEMINI) ---
    const btnIa = document.getElementById('btn-ia');
    btnIa.addEventListener('click', async () => {
        const txt = document.getElementById('ia-input').value.trim();
        if(!txt) return;
        let key = localStorage.getItem('gemini_api_key') || prompt("Pegá tu API Key:");
        if(!key) return;
        localStorage.setItem('gemini_api_key', key);
        
        btnIa.innerText = "⏳...";
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
                method: 'POST',
                body: JSON.stringify({ contents: [{ parts: [{ text: `Extrae JSON: {cantidad, descripcion, codigo1, codigo2, proveedor, observaciones} del texto: "${txt}"` }] }] })
            });
            const data = await res.json();
            const cleanJson = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json|```/g, ''));
            Object.keys(cleanJson).forEach(k => { if(document.getElementById(k)) document.getElementById(k).value = cleanJson[k]; });
            document.getElementById('ia-input').value = "";
        } catch(e) { alert("Error IA"); }
        btnIa.innerText = "Procesar";
    });

    // --- MICRÓFONO ---
    const btnMic = document.getElementById('btn-microfono');
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'es-AR';
    btnMic.addEventListener('click', () => recognition.start());
    recognition.onresult = (e) => document.getElementById('ia-input').value = e.results[0][0].transcript;

    renderInventario();
});