document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // 1. ESTRUCTURA BASE Y PERSISTENCIA DE DATOS (LOCALSTORAGE)
    // =========================================================================
    let inventario = JSON.parse(localStorage.getItem('taller_inventario')) || [];
    
    const form = document.getElementById('inventory-form');
    const fechaInput = document.getElementById('fecha');
    const dynamicFieldsContainer = document.getElementById('dynamic-fields');
    const btnAddField = document.getElementById('btn-add-field');

    // Autocompletar la fecha de hoy por defecto
    if (fechaInput) {
        fechaInput.value = new Date().toISOString().split('T')[0];
    }

    // Guardar campos dinámicos / extras agregados en el formulario
    let extrasCount = 0;
    if (btnAddField && dynamicFieldsContainer) {
        btnAddField.addEventListener('click', () => {
            extrasCount++;
            const fieldId = `extra-${extrasCount}`;
            
            const div = document.createElement('div');
            div.className = "flex gap-2 items-center animate-fade-in-down";
            div.id = `container-${fieldId}`;
            
            div.innerHTML = `
                <input type="text" placeholder="Nombre del dato (Ej: Estante)" class="w-1/3 bg-[#121214] border border-[#29292e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500" data-extra-key="${fieldId}">
                <input type="text" placeholder="Valor" class="w-2/3 bg-[#121214] border border-[#29292e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500" data-extra-value="${fieldId}">
                <button type="button" class="text-red-400 hover:text-red-300 text-xs px-2" onclick="document.getElementById('container-${fieldId}').remove()">✕</button>
            `;
            dynamicFieldsContainer.appendChild(div);
        });
    }

    // =========================================================================
    // 2. CONTROL DE ACCESO COMERCIAL (CÓDIGO DE ACTIVACIÓN)
    // =========================================================================
    const CODIGO_ACTIVACION_VALIDO = "TALLER-LUKS-2026"; 

    function verificarAcceso() {
        let estadoAcceso = localStorage.getItem('luks_app_activada');

        if (estadoAcceso !== 'true') {
            if (form) form.style.opacity = "0.1";
            
            setTimeout(() => {
                let codigoUsuario = prompt("🔑 ¡Bienvenido a Luk's Stock Manager!\n\nPara activar el uso de la aplicación en este dispositivo, ingresa tu código de activación o comunícate con soporte:");
                
                if (codigoUsuario === CODIGO_ACTIVACION_VALIDO) {
                    localStorage.setItem('luks_app_activada', 'true');
                    alert("✅ ¡Aplicación activada con éxito en este dispositivo!");
                    window.location.reload();
                } else {
                    alert("❌ Código incorrecto. La aplicación permanecerá bloqueada.");
                    if (form) {
                        form.addEventListener('submit', (e) => e.preventDefault(), true);
                    }
                }
            }, 500);
        }
    }
    verificarAcceso();

    // =========================================================================
    // 3. EFECTOS DE ENFOQUE (FOCUS) EN LAS TARJETAS DEL FORMULARIO
    // =========================================================================
    const inputsFormulario = document.querySelectorAll('#inventory-form input, #inventory-form textarea, #ia-input');
    inputsFormulario.forEach(input => {
        input.addEventListener('focus', (e) => {
            const seccionContenedora = e.target.closest('section') || e.target.closest('.bg-[#202024]');
            if (seccionContenedora) seccionContenedora.classList.add('seccion-enfocada');
        });
        input.addEventListener('blur', (e) => {
            const seccionContenedora = e.target.closest('section') || e.target.closest('.bg-[#202024]');
            if (seccionContenedora) seccionContenedora.classList.remove('seccion-enfocada');
        });
    });

    // =========================================================================
    // 4. MOTOR DE RENDIMIENTO: TABLA CLÁSICA CON MULTI-FILTROS Y ANIMACIÓN
    // =========================================================================
    let ordenFechaAsc = false;
    let ordenCodigo1Asc = true;
    let idUltimoItemCreado = null; 

    function renderInventario(datosParaMostrar = inventario) {
        const cuerpoTabla = document.getElementById('inventario-cuerpo');
        if (!cuerpoTabla) return;

        cuerpoTabla.innerHTML = '';

        if (datosParaMostrar.length === 0) {
            cuerpoTabla.innerHTML = `
                <tr>
                    <td colspan="7" class="px-3 py-6 text-center text-[#a8a8b3] italic">
                        No se encontraron registros en la planilla con los filtros aplicados.
                    </td>
                </tr>`;
            return;
        }

        datosParaMostrar.forEach((item) => {
            const fila = document.createElement('tr');
            fila.className = "hover:bg-[#29292e] transition-colors group";
            
            if (item.id === idUltimoItemCreado) {
                fila.classList.add('animar-fila-nueva');
            }

            // DETECTOR AUTOMÁTICO DE CATEGORÍAS (Tags visuales)
            let etiquetaCategoria = '';
            const descMinuscula = (item.descripcion || '').toLowerCase();
            
            const palabrasHerramienta = ['pinza', 'destornillador', 'llave', 'tubo', 'martillo', 'mecha', 'pinzas', 'multimetro', 'calibre', 'soldadora'];
            const palabrasRepuesto = ['correa', 'bujia', 'bujías', 'filtro', 'reten', 'o-ring', 'oring', 'pastilla', 'disco', 'manguera', 'amortiguador', 'bomba'];

            if (palabrasHerramienta.some(p => descMinuscula.includes(p))) {
                etiquetaCategoria = `<span class="bg-blue-900/40 text-blue-400 border border-blue-500/30 text-[10px] px-1.5 py-0.5 rounded font-medium ml-2 whitespace-nowrap">🔧 Herramienta</span>`;
            } else if (palabrasRepuesto.some(p => descMinuscula.includes(p))) {
                etiquetaCategoria = `<span class="bg-amber-900/40 text-amber-400 border border-amber-500/30 text-[10px] px-1.5 py-0.5 rounded font-medium ml-2 whitespace-nowrap">📦 Repuesto</span>`;
            }

            let detallesExtras = '';
            if (item.extras && Object.keys(item.extras).length > 0) {
                detallesExtras = Object.entries(item.extras)
                    .map(([clave, valor]) => ` | ${clave}: ${valor}`)
                    .join('');
            }

            fila.innerHTML = `
                <td class="px-3 py-3 font-mono text-[#a8a8b3] whitespace-nowrap">${item.fecha || '-'}</td>
                <td class="px-3 py-3 font-semibold text-emerald-400">${item.cantidad || '0'}</td>
                <td class="px-3 py-3 max-w-xs truncate" title="${item.descripcion}">
                    <span class="font-medium">${item.descripcion || '-'}</span>${etiquetaCategoria}
                </td>
                <td class="px-3 py-3 font-mono whitespace-nowrap">${item.codigo1 || '-'}</td>
                <td class="px-3 py-3 font-mono whitespace-nowrap">${item.codigo2 || '-'}</td>
                <td class="px-3 py-3 text-[#a8a8b3] max-w-xs truncate" title="${item.proveedor}">${item.proveedor || '-'}${detallesExtras}</td>
                <td class="px-3 py-3 text-center whitespace-nowrap">
                    <button class="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity font-medium px-2 py-0.5 rounded text-[11px]" onclick="eliminarItem(${item.id})">
                        ❌ Borrar
                    </button>
                </td>
            `;
            cuerpoTabla.appendChild(fila);
        });
    }

    // Mecanismo de borrado adaptado a la planilla
    window.eliminarItem = function(id) {
        if(confirm("¿Estás seguro de que deseas eliminar este registro de la planilla?")) {
            inventario = inventario.filter(item => item.id !== id);
            localStorage.setItem('taller_inventario', JSON.stringify(inventario));
            aplicarFiltrosCruzados();
        }
    };

    // Función de filtrado dinámico simultáneo en las celdas
    function aplicarFiltrosCruzados() {
        const valFecha = document.getElementById('filtro-fecha')?.value.toLowerCase() || '';
        const valDesc = document.getElementById('filtro-descripcion')?.value.toLowerCase() || '';
        const valCod1 = document.getElementById('filtro-codigo1')?.value.toLowerCase() || '';
        const valProv = document.getElementById('filtro-proveedor')?.value.toLowerCase() || '';

        const filtrados = inventario.filter(item => {
            const matchFecha = (item.fecha || '').toLowerCase().includes(valFecha);
            const matchDesc = (item.descripcion || '').toLowerCase().includes(valDesc);
            const matchCod1 = (item.codigo1 || '').toLowerCase().includes(valCod1);
            const matchProv = (item.proveedor || '').toLowerCase().includes(valProv);
            return matchFecha && matchDesc && matchCod1 && matchProv;
        });
        renderInventario(filtrados);
    }

    // Escuchadores de eventos para los inputs de filtro de la primera fila
    document.getElementById('filtro-fecha')?.addEventListener('input', aplicarFiltrosCruzados);
    document.getElementById('filtro-descripcion')?.addEventListener('input', aplicarFiltrosCruzados);
    document.getElementById('filtro-codigo1')?.addEventListener('input', aplicarFiltrosCruzados);
    document.getElementById('filtro-proveedor')?.addEventListener('input', aplicarFiltrosCruzados);

    // Ordenamiento por Clic en los encabezados
    document.getElementById('th-fecha')?.addEventListener('click', () => {
        ordenFechaAsc = !ordenFechaAsc;
        inventario.sort((a, b) => {
            const fechaA = new Date(a.fecha || '1970-01-01');
            const fechaB = new Date(b.fecha || '1970-01-01');
            return ordenFechaAsc ? fechaA - fechaB : fechaB - fechaA;
        });
        aplicarFiltrosCruzados();
    });

    document.getElementById('th-codigo1')?.addEventListener('click', () => {
        ordenCodigo1Asc = !ordenCodigo1Asc;
        inventario.sort((a, b) => {
            const codA = (a.codigo1 || '').toLowerCase();
            const codB = (b.codigo1 || '').toLowerCase();
            if (codA < codB) return ordenCodigo1Asc ? -1 : 1;
            if (codA > codB) return ordenCodigo1Asc ? 1 : -1;
            return 0;
        });
        aplicarFiltrosCruzados();
    });

    // =========================================================================
    // 5. EVENTO DE ENVÍO Y GUARDADO DEL FORMULARIO DE INGRESO
    // =========================================================================
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // Recopilar los campos adicionales / extras
            const extras = {};
            const keys = document.querySelectorAll('[data-extra-key]');
            keys.forEach(keyInput => {
                const id = keyInput.getAttribute('data-extra-key');
                const valInput = document.querySelector(`[data-extra-value="${id}"]`);
                const clave = keyInput.value.trim();
                const valor = valInput ? valInput.value.trim() : '';
                if (clave) extras[clave] = valor;
            });

            const nuevoItem = {
                id: Date.now(),
                fecha: document.getElementById('fecha').value,
                cantidad: document.getElementById('cantidad').value,
                descripcion: document.getElementById('descripcion').value.trim(),
                codigo1: document.getElementById('codigo1').value.trim(),
                codigo2: document.getElementById('codigo2').value.trim(),
                proveedor: document.getElementById('proveedor').value.trim(),
                observaciones: document.getElementById('observaciones').value.trim(),
                extras: extras
            };

            inventario.push(nuevoItem);
            localStorage.setItem('taller_inventario', JSON.stringify(inventario));
            
            idUltimoItemCreado = nuevoItem.id; // Activar animación

            // Resetear formulario y restaurar valores base
            form.reset();
            if (fechaInput) fechaInput.value = new Date().toISOString().split('T')[0];
            if (dynamicFieldsContainer) dynamicFieldsContainer.innerHTML = '';

            aplicarFiltrosCruzados();

            setTimeout(() => {
                idUltimoItemCreado = null;
            }, 3000);
        });
    }

    // =========================================================================
    // 6. ASISTENTE DE CARGA RÁPIDA IA CON CONEXIÓN DIRECTA A GEMINI API
    // =========================================================================
    const btnIa = document.getElementById('btn-ia');
    const iaInput = document.getElementById('ia-input');

    if (btnIa && iaInput) {
        btnIa.addEventListener('click', async () => {
            const textoDesordenado = iaInput.value.trim();
            if (!textoDesordenado) {
                alert('Por favor, ingresa un texto desordenado para procesar.');
                return;
            }

            let apiKey = localStorage.getItem('gemini_api_key');
            if (!apiKey) {
                apiKey = prompt("🔐 Para activar la IA, pega tu API Key de Google AI Studio (Se guardará local y segura):");
                if (!apiKey) {
                    alert("Se requiere la API Key para procesar el texto con Inteligencia Artificial.");
                    return;
                }
                localStorage.setItem('gemini_api_key', apiKey);
            }

            btnIa.disabled = true;
            btnIa.innerText = 'Analizando... ⏳';

            const promptInstrucciones = `Actúa como un extractor de datos experto para un taller. Analiza el siguiente texto desordenado que describe el ingreso de un material y extrae la información requerida estrictamente en este formato JSON, sin textos extras, sin bloques de código, solo el objeto JSON directo. Si un dato no existe, devuélvelo como cadena vacía "".
            Texto a analizar: "${textoDesordenado}"
            
            Formato requerido:
            {
                "cantidad": "solo el número",
                "descripcion": "nombre o descripción del ítem",
                "codigo1": "código de fábrica o nro parte si aplica",
                "codigo2": "código interno si aplica",
                "proveedor": "nombre del proveedor",
                "observaciones": "notas o estado del material"
            }`;

            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: promptInstrucciones }] }]
                    })
                });

                if (!response.ok) throw new Error('Error en la respuesta de la API de Google.');

                const data = await response.json();
                let respuestaTexto = data.candidates[0].content.parts[0].text.trim();
                respuestaTexto = respuestaTexto.replace(/```json|```/g, '').trim();

                const datosExtraidos = JSON.parse(respuestaTexto);

                if (datosExtraidos.cantidad) document.getElementById('cantidad').value = datosExtraidos.cantidad;
                if (datosExtraidos.descripcion) document.getElementById('descripcion').value = datosExtraidos.descripcion;
                if (datosExtraidos.codigo1) document.getElementById('codigo1').value = datosExtraidos.codigo1;
                if (datosExtraidos.codigo2) document.getElementById('codigo2').value = datosExtraidos.codigo2;
                if (datosExtraidos.proveedor) document.getElementById('proveedor').value = datosExtraidos.proveedor;
                if (datosExtraidos.observaciones) document.getElementById('observaciones').value = datosExtraidos.observaciones;

                iaInput.value = '';
                alert('✨ ¡Campos autocompletados por el asistente de IA con éxito! Revisa los datos y presiona Guardar.');

            } catch (error) {
                console.error(error);
                localStorage.removeItem('gemini_api_key'); // Eliminar clave si falla para forzar re-ingreso
                alert('❌ Hubo un problema al procesar el texto con la IA. La clave vieja fue eliminada por seguridad. Reintenta de nuevo.');
            } finally {
                btnIa.disabled = false;
                btnIa.innerText = 'Procesar';
            }
        });
    }

    // =========================================================================
    // 7. FUNCIÓN DE DICTADO POR VOZ (SPEECH TO TEXT) NATIVO
    // =========================================================================
    const btnMicrofono = document.getElementById('btn-microfono');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition && btnMicrofono && iaInput) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-AR';
        recognition.continuous = false;
        recognition.interimResults = false;

        btnMicrofono.addEventListener('click', () => {
            try {
                recognition.start();
                btnMicrofono.innerText = '🛑';
                btnMicrofono.classList.add('border-red-500', 'text-red-500');
                iaInput.placeholder = "Escuchando... Hablá ahora...";
            } catch (error) {
                console.log("El reconocimiento ya estaba activo.");
            }
        });

        recognition.onresult = (event) => {
            const textoDictado = event.results[0][0].transcript;
            iaInput.value = textoDictado;
        };

        recognition.onend = () => {
            btnMicrofono.innerText = '🎙️';
            btnMicrofono.classList.remove('border-red-500', 'text-red-500');
            iaInput.placeholder = "Ej: Llegaron 5 bujías código AX4 proveedor RepuestosSur...";
        };

        recognition.onerror = (event) => {
            console.error("Error en el reconocimiento de voz: ", event.error);
            alert("No se pudo procesar el audio. Asegurate de otorgar permisos de micrófono.");
        };
    } else if (btnMicrofono) {
        btnMicrofono.title = "Tu navegador no soporta dictado por voz.";
    }

    // Cargar la planilla con la base de datos inicial de localStorage
    renderInventario();

    // =========================================================================
    // 8. REGISTRO DEL SERVICE WORKER PARA ACTIVAR PWA INSTALABLE
    // =========================================================================
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('PWA: Motor de instalacion activo', reg))
                .catch(err => console.error('PWA: Error al activar instalacion', err));
        });
    }
});