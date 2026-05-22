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

    // 3. Función para renderizar la lista en pantalla
    function renderInventario(itemsFiltrados = inventario) {
        inventoryList.innerHTML = '';

        if (itemsFiltrados.length === 0) {
            inventoryList.innerHTML = `
                <div class="text-center py-8 text-[#7c7c8a] text-xs border border-dashed border-[#29292e] rounded-lg">
                    No se encontraron ítems.
                </div>`;
            return;
        }

        // Mostrar primero los más recientes
        [...itemsFiltrados].reverse().forEach((item) => {
            const card = document.createElement('div');
            card.className = 'bg-[#121214] p-4 rounded-xl border border-[#29292e] relative group hover:border-[#3a3a42] transition-all';
            
            // Renderizar campos extra si existen
            let extraHTML = '';
            if (item.extras && item.extras.length > 0) {
                extraHTML = `<div class="mt-2 pt-2 border-t border-[#29292e]/50 grid grid-cols-2 gap-1 text-[11px]">`;
                item.extras.forEach(ext => {
                    extraHTML += `<div><span class="text-[#7c7c8a]">${ext.clave}:</span> <span class="text-emerald-400">${ext.valor}</span></div>`;
                });
                extraHTML += `</div>`;
            }

            card.innerHTML = `
                <button class="absolute top-3 right-3 text-xs text-[#7c7c8a] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity btn-delete" data-id="${item.id}">Eliminar</button>
                <div class="flex justify-between items-start gap-2">
                    <span class="bg-emerald-500/10 text-emerald-400 text-[11px] font-mono px-2 py-0.5 rounded-md">Cant: ${item.cantidad}</span>
                    <span class="text-[10px] text-[#7c7c8a]">${item.fecha}</span>
                </div>
                <h3 class="text-sm font-medium text-white mt-2">${item.descripcion}</h3>
                <div class="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-[11px] text-[#a8a8b3]">
                    <div><span class="text-[#7c7c8a]">Cód 1:</span> ${item.codigo1 || '-'}</div>
                    <div><span class="text-[#7c7c8a]">Cód 2:</span> ${item.codigo2 || '-'}</div>
                    <div class="col-span-2"><span class="text-[#7c7c8a]">Prov:</span> ${item.proveedor || '-'}</div>
                </div>
                ${item.observaciones ? `<p class="text-[11px] text-[#7c7c8a] italic mt-1.5 bg-[#202024] p-1.5 rounded border border-[#29292e]/40">Obs: ${item.observaciones}</p>` : ''}
                ${extraHTML}
            `;
            inventoryList.appendChild(card);
        });

        // Asignar eventos a los botones de eliminar
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idAEliminar = parseInt(e.target.getAttribute('data-id'));
                inventario = inventario.filter(item => item.id !== idAEliminar);
                localStorage.setItem('taller_inventario', JSON.stringify(inventario));
                renderInventario();
            });
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

}); // <-- Cierre del archivo