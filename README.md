# 🛠️ Luk's Stock Manager

**Luk's Stock Manager** es una aplicación web moderna, minimalista y optimizada para el control, registro e inventario de repuestos, materiales, insumos y herramientas en el taller. Diseñada con una interfaz oscura que protege la vista durante las jornadas de trabajo y adaptada al 100% para su uso rápido desde teléfonos celulares y computadoras.

El objetivo principal de esta herramienta es transformar los ingresos desordenados de mercadería en un registro limpio, rápido y fácil de consultar en tiempo real.

---

## ✨ Características Principales

* **📥 Carga Rápida y Optimizada:** Formulario ágil con campos esenciales: Fecha (autocompletada con el día de hoy), Cantidad, Descripción, Código de Fábrica (Código 1), Código Interno o de Barras (Código 2), Proveedor y Observaciones.
* **➕ Campos Dinámicos Adicionales:** ¿Necesitás registrar un dato imprevisto (como el número de estante, pasillo o lote)? Podés añadir infinitos campos personalizados sobre la marcha con un solo clic.
* **🔍 Buscador Inteligente en Tiempo Real:** Filtra instantáneamente todo el inventario de la columna derecha a medida que escribís una letra, un código, el nombre de un repuesto o un proveedor.
* **💾 Persistencia de Datos Local (`localStorage`):** Los datos se guardan de forma segura en el almacenamiento de tu navegador. Aunque cierres la pestaña, apagues la computadora o te quedes sin internet, tu inventario no se borrará.
* **🤖 Asistente IA (Próximamente):** Estructura preparada para conectar funciones serverless con la API de Gemini, permitiendo pegar textos masivos desordenados y autocompletar el formulario de forma inteligente.

---

## 🛠️ Tecnologías Utilizadas

El proyecto fue desarrollado bajo una arquitectura limpia y ultra ligera para garantizar velocidad máxima en cualquier dispositivo:
* **HTML5:** Estructura semántica del sistema.
* **Tailwind CSS (v4):** Framework de diseño moderno para lograr una estética oscura, minimalista y responsive.
* **JavaScript (Vanilla ES6):** Lógica del negocio, manipulación de datos del DOM, filtrados en tiempo real y persistencia local.

---

## 📂 Estructura del Proyecto

```text
taller-inventario/
├── index.html      # Estructura del formulario, banner y lista de stock
├── style.css       # Ajustes estéticos específicos (scrollbars y calendarios nativos)
├── app.js          # Lógica de guardado, buscador dinámico y campos extra
└── README.md       # Documentación e información general del proyecto (este archivo)

## 🌐 Despliegue (Hosting)

Esta aplicación está diseñada para ser alojada de forma estática, rápida y 100% gratuita utilizando **GitHub Pages**, corriendo directamente desde este repositorio sin necesidad de servidores externos ni configuraciones de terceros. Cada actualización que subas impactará online al instante.