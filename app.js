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

// 6. Asistente de Carga Rápida IA (Agregalo acá abajo)
    const btnIa = document.getElementById('btn-ia');
    const iaInput = document.getElementById('ia-input');

    btnIa.addEventListener('click', () => {
        const textoDesordenado = iaInput.value.trim();
        if (!textoDesordenado) {
            alert('Por favor, ingresa un texto desordenado para procesar.');
            return;
        }

        alert(`✨ Asistente de Carga: Recibido tu texto: "${textoDesordenado}".\n\nLa estructura de análisis local está lista. En la próxima fase conectaremos el modelo de Gemini directo para procesar la extracción automática al formulario.`);
        iaInput.value = '';
    });

});