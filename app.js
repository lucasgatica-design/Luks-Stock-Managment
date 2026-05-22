document.addEventListener('DOMContentLoaded', () => {
    // Referencias de elementos del DOM
    const form = document.getElementById('inventory-form');
    const inventoryList = document.getElementById('inventory-list');
    const searchInput = document.getElementById('search-input');
    const btnAddField = document.getElementById('btn-add-field');
    const dynamicFieldsContainer = document.getElementById('dynamic-fields');
    const fechaInput = document.getElementById('fecha');

    // Cargar inventario inicial desde localStorage
    let inventario = JSON.parse(localStorage.getItem('taller_inventario')) || [];

    // 1. Establecer la fecha de hoy por defecto
    if (fechaInput) {
        fechaInput.value = new Date().toISOString().split('T')[0];
    }

    // 2. Agregar campos personalizados dinámicos
    btnAddField.addEventListener('click', () => {
        const fieldId = 'extra-' + Date.now();
        const fieldWrapper = document.createElement('div');
        fieldWrapper.className = 'flex gap-2 items-center dynamic-field-row';
        fieldWrapper.id = fieldId;

        fieldWrapper.innerHTML = `
            <input type="text" placeholder="Dato (Ej: Estante)" class="w-1/3 bg-[#121214] border border-[#29292e] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 text-emerald-400 font-medium field-key">
            <input type="text" placeholder="Valor" class="w-2/3 bg-[#121214] border border-[#29292e] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 field-value">
            <button type="button" onclick="document.getElementById('${fieldId}').remove()" class="text-[#7c7c8a] hover:text-red-400 p-2 text-sm transition-colors">✕</button>
        `;
        dynamicFieldsContainer.appendChild(fieldWrapper);
    });

    // Variables de control de estado para el ordenamiento de la planilla
    let ordenFechaAsc = false;
    let ordenCodigo1Asc = true;
    let idUltimoItemCreado = null; // Para saber qué fila animar al guardar

    // =========================================================================
    // PROPUESTA 1: EFECTOS DE ENFOQUE (FOCUS) EN LAS TARJETAS DEL FORMULARIO
    // =========================================================================
    const inputsFormulario = document.querySelectorAll('#inventory-form input, #inventory-form textarea, #ia-input');
    inputsFormulario.forEach(input => {
        // Al hacer foco en un casillero, iluminamos su tarjeta contenedora con resplando esmeralda
        input.addEventListener('focus', (e) => {
            const seccionContenedora = e.target.closest('section') || e.target.closest('.bg-[#202024]');
            if (seccionContenedora) seccionContenedora.classList.add('seccion-enfocada');
        });
        // Al salir del casillero, removemos el brillo
        input.addEventListener('blur', (e) => {
            const seccionContenedora = e.target.closest('section') || e.target.closest('.bg-[#202024]');
            if (seccionContenedora) seccionContenedora.classList.remove('seccion-enfocada');
        });
    });

    // =========================================================================
    // MOTOR DE RENDIMIENTO: TABLA CLÁSICA CON MULTI-FILTROS Y ANIMACIÓN
    // =========================================================================
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
            
            // Si es el elemento recién guardado, le disparamos la animación de caída suave
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

            // Unir campos dinámicos adicionales si existen en el campo de proveedor/observaciones
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
        const valFecha = document.getElementById('filtro-fecha').value.toLowerCase();
        const valDesc = document.getElementById('filtro-descripcion').value.toLowerCase();
        const valCod1 = document.getElementById('filtro-codigo1').value.toLowerCase();
        const valProv = document.getElementById('filtro-proveedor').value.toLowerCase();

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

    // Ordenamiento por Clic: De más reciente a más antiguo (y viceversa)
    document.getElementById('th-fecha')?.addEventListener('click', () => {
        ordenFechaAsc = !ordenFechaAsc;
        inventario.sort((a, b) => {
            const fechaA = new Date(a.fecha || '1970-01-01');
            const fechaB = new Date(b.fecha || '1970-01-01');
            return ordenFechaAsc ? fechaA - fechaB : fechaB - fechaA;
        });
        aplicarFiltrosCruzados();
    });

    // Ordenamiento por Clic: Alfabético por Código 1
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

    // Interceptar el envío del formulario para capturar la animación antes del reset
    const formularioOriginal = document.getElementById('inventory-form');
    if (formularioOriginal) {
        formularioOriginal.addEventListener('submit', () => {
            // Buscamos el ítem que se acaba de insertar en el array local
            if (inventario.length > 0) {
                const ultimoItem = inventario[inventario.length - 1];
                idUltimoItemCreado = ultimoItem.id;
            }
            // Apagamos el estado de animación después de 3 segundos
            setTimeout(() => {
                idUltimoItemCreado = null;
            }, 3000);
        });
    }

    // 4. Manejar el envío del formulario (Guardar item)
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Recolectar datos dinámicos extras
        const extras = [];
        document.querySelectorAll('.dynamic-field-row').forEach(row => {
            const clave = row.querySelector('.field-key').value.trim();
            const valor = row.querySelector('.field-value').value.trim();
            if (clave && valor) {
                extras.push({ clave, valor });
            }
        });

        // Crear el objeto del nuevo repuesto
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

        // Guardar en el arreglo y en localStorage
        inventario.push(nuevoItem);
        localStorage.setItem('taller_inventario', JSON.stringify(inventario));

        // Reiniciar formulario y restaurar fecha/campos dinámicos
        form.reset();
        fechaInput.value = new Date().toISOString().split('T')[0];
        dynamicFieldsContainer.innerHTML = '';

        // Actualizar la lista en pantalla
        renderInventario();
    });

    // 5. Buscador en tiempo real
    searchInput.addEventListener('input', (e) => {
        const busqueda = e.target.value.toLowerCase();
        const filtrados = inventario.filter(item => {
            return item.descripcion.toLowerCase().includes(busqueda) ||
                   item.codigo1.toLowerCase().includes(busqueda) ||
                   item.codigo2.toLowerCase().includes(busqueda) ||
                   item.proveedor.toLowerCase().includes(busqueda);
        });
        renderInventario(filtrados);
    });

    // Renderizar al cargar la página por primera vez
    renderInventario();

// 6. Asistente de Carga Rápida IA con Conexión Directa a Gemini API
    const btnIa = document.getElementById('btn-ia');
    const iaInput = document.getElementById('ia-input');

    if (btnIa && iaInput) {
        btnIa.addEventListener('click', async () => {
            const textoDesordenado = iaInput.value.trim();
            if (!textoDesordenado) {
                alert('Por favor, ingresa un texto desordenado para procesar.');
                return;
            }

            // Solicitar la API Key de forma segura si no está guardada localmente
            let apiKey = localStorage.getItem('gemini_api_key');
            if (!apiKey) {
                apiKey = prompt("🔐 Para activar la IA, pega tu API Key de Google AI Studio (Se guardará de forma local y segura en tu navegador):");
                if (!apiKey) {
                    alert("Se requiere la API Key para procesar el texto con Inteligencia Artificial.");
                    return;
                }
                localStorage.setItem('gemini_api_key', apiKey.trim()); // Asegura quitar espacios fantasmas
            }

            // Cambiar el estado del botón para mostrar que la IA está pensando
            btnIa.disabled = true;
            btnIa.innerText = 'Analizando... ⏳';

            // Prompt interno robusto
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
                // Llamada directa al modelo Gemini 2.5 Flash
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: promptInstrucciones }] }]
                    })
                });

                if (!response.ok) throw new Error('Error de autenticación o respuesta de Google.');

                const data = await response.json();
                let respuestaTexto = data.candidates[0].content.parts[0].text.trim();
                
                // Limpieza absoluta de bloques de código markdown de la IA
                respuestaTexto = respuestaTexto.replace(/```json|```/g, '').trim();

                // Parsear el resultado enviado por Gemini
                const datosExtraidos = JSON.parse(respuestaTexto);

                // Rellenar automáticamente los campos del formulario en pantalla
                if (datosExtraidos.cantidad) document.getElementById('cantidad').value = datosExtraidos.cantidad;
                if (datosExtraidos.descripcion) document.getElementById('descripcion').value = datosExtraidos.descripcion;
                if (datosExtraidos.codigo1) document.getElementById('codigo1').value = datosExtraidos.codigo1;
                if (datosExtraidos.codigo2) document.getElementById('codigo2').value = datosExtraidos.codigo2;
                if (datosExtraidos.proveedor) document.getElementById('proveedor').value = datosExtraidos.proveedor;
                if (datosExtraidos.observaciones) document.getElementById('observaciones').value = datosExtraidos.observaciones;

                // Limpiar el campo de entrada de texto
                iaInput.value = '';
                alert('✨ ¡Campos autocompletados por el asistente de IA con éxito! Revisa los datos y presiona Guardar.');

            } catch (error) {
                console.error(error);
                // TRUCO DE TALLER: Si falla, borramos la clave de la memoria para obligar a pedirla limpia la próxima vez
                localStorage.removeItem('gemini_api_key');
                alert('❌ Hubo un problema al procesar el texto con la IA. La clave vieja fue eliminada por seguridad. Por favor, vuelve a presionar "Procesar" y pega tu API Key de Google AI Studio asegurándote de que esté copiada completa y sin espacios.');
            } finally {
                // Restaurar el botón a su estado original
                btnIa.disabled = false;
                btnIa.innerText = 'Procesar';
            }
        });
    }
// 9. Función de Dictado por Voz (Speech to Text) Nativo
    const btnMicrofono = document.getElementById('btn-microfono');
    const inputIA = document.getElementById('ia-input');

    // Verificar si el navegador del celular o PC soporta reconocimiento de voz
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition && btnMicrofono && inputIA) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-AR'; // Configurado para español de Argentina
        recognition.continuous = false; // Termina de escuchar cuando haces una pausa larga
        recognition.interimResults = false; // Solo devuelve el resultado final pulido

        // Cuando el usuario toca el micrófono
        btnMicrofono.addEventListener('click', () => {
            try {
                recognition.start();
                btnMicrofono.innerText = '🛑'; // Cambia el ícono a stop mientras escucha
                btnMicrofono.classList.add('border-red-500', 'text-red-500');
                inputIA.placeholder = "Escuchando... Hablá ahora...";
            } catch (error) {
                console.log("El reconocimiento ya estaba activo.");
            }
        });

        // Cuando la IA termina de procesar lo que hablaste
        recognition.onresult = (event) => {
            const textoDictado = event.results[0][0].transcript;
            inputIA.value = textoDictado; // Estampamos tu voz en la caja de texto
        };

        // Al apagar el micrófono (ya sea por error, pausa o éxito)
        recognition.onend = () => {
            btnMicrofono.innerText = '🎙️'; // Restauramos el botón original
            btnMicrofono.classList.remove('border-red-500', 'text-red-500');
            inputIA.placeholder = "Ej: Llegaron 5 bujías código AX4 proveedor RepuestosSur...";
        };

        recognition.onerror = (event) => {
            console.error("Error en el reconocimiento de voz: ", event.error);
            alert("No se pudo procesar el audio. Asegurate de dar permisos de micrófono.");
        };
    } else if (btnMicrofono) {
        // Ocultar o avisar si abren la app en un navegador viejo que no tiene micrófono
        btnMicrofono.title = "Tu navegador no soporta dictado por voz.";
    }
// 7. Registro de Service Worker para hacer la App Instalable
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('PWA: Motor de instalacion activo', reg))
                .catch(err => console.error('PWA: Error al activar instalacion', err));
        });
    }
// 8. Control de Acceso Comercial: Validación por Código de Activación
    const formularioPrincipal = document.getElementById('inventory-form');
    
    // DEFINÍ ACÁ TU CONTRASEÑA MAESTRA (La que le vas a dar a tus conocidos)
    const CODIGO_ACTIVACION_VALIDO = "TALLER-LUKS-2026"; 

    function verificarAcceso() {
        let estadoAcceso = localStorage.getItem('luks_app_activada');

        if (estadoAcceso !== 'true') {
            // Si no está activada, bloqueamos visualmente el formulario y el asistente
            if (formularioPrincipal) formularioPrincipal.style.opacity = "0.2";
            if (dynamicFieldsContainer) dynamicFieldsContainer.style.pointerEvents = "none";
            
            // Pedimos el código al usuario de forma elegante
            setTimeout(() => {
                let codigoUsuario = prompt("🔑 ¡Bienvenido a Luk's Stock Manager!\n\nPara activar el uso de la aplicación en este dispositivo, ingresa tu código de activación o comunícate con soporte:");
                
                if (codigoUsuario === CODIGO_ACTIVACION_VALIDO) {
                    localStorage.setItem('luks_app_activada', 'true');
                    alert("✅ ¡Aplicación activada con éxito en este dispositivo! Ya puedes operar.");
                    window.location.reload(); // Recargamos para desbloquear todo limpio
                } else {
                    alert("❌ Código incorrecto o inválido. La aplicación permanecerá bloqueada.");
                    // Forzamos el bloqueo estricto si cancela o se equivoca
                    if (formularioPrincipal) {
                        formularioPrincipal.addEventListener('submit', (e) => e.preventDefault(), true);
                    }
                }
            }, 500);
        }
    }

    // Ejecutamos la verificación apenas abre la aplicación
    verificarAcceso();

}); // <-- Cierre del archivo