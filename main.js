const API_BASE_URL = 'https://lavadero-ubdd.onrender.com/api';

// Variable para controlar el bloqueo
let isProcessing = false;

// Sistema de notificaciones Toast
function mostrarToast(titulo, mensaje, tipo = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    
    const iconos = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">${iconos[tipo]}</div>
        <div class="toast-content">
            <div class="toast-title">${titulo}</div>
            ${mensaje ? `<div class="toast-message">${mensaje}</div>` : ''}
        </div>
        <button class="toast-close" onclick="cerrarToast(this)">×</button>
    `;
    
    container.appendChild(toast);
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
        if (toast.parentElement) {
            cerrarToast(toast.querySelector('.toast-close'));
        }
    }, 5000);
}

function cerrarToast(btn) {
    const toast = btn.closest('.toast');
    toast.classList.add('removing');
    setTimeout(() => {
        toast.remove();
    }, 300);
}

// Sistema de confirmación con modal
function mostrarConfirmacion(titulo, mensaje) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const confirmBtn = document.getElementById('modalConfirmBtn');
        
        modalTitle.textContent = titulo;
        modalMessage.textContent = mensaje;
        modal.classList.add('active');
        
        // Remover listeners anteriores
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.onclick = () => {
            modal.classList.remove('active');
            resolve(true);
        };
        
        // Actualizar la referencia global
        window.cerrarModal = () => {
            modal.classList.remove('active');
            resolve(false);
        };
    });
}

function cerrarModal() {
    document.getElementById('confirmModal').classList.remove('active');
}

// Funciones de bloqueo
function bloquearSistema(mensaje = 'Procesando...') {
    isProcessing = true;
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = overlay.querySelector('.loading-text');
    loadingText.textContent = mensaje;
    overlay.classList.add('active');
    
    document.querySelectorAll('button').forEach(btn => btn.disabled = true);
}

function desbloquearSistema() {
    isProcessing = false;
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.remove('active');
    
    document.querySelectorAll('button').forEach(btn => btn.disabled = false);
}

async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
}

// Función para convertir de UTC (Render) a hora de Colombia (UTC-5)
function convertirAHoraLocal(fechaString) {
    if (!fechaString || fechaString === 'N/A') return 'N/A';
    
    try {
        if (fechaString.length <= 5 && fechaString.includes(':')) {
            return fechaString;
        }
        
        let fecha;
        if (fechaString.includes(' ')) {
            const isoString = fechaString.replace(' ', 'T') + 'Z';
            fecha = new Date(isoString);
        } else {
            fecha = new Date(fechaString + 'Z');
        }
        
        if (isNaN(fecha.getTime())) {
            console.error('Fecha inválida:', fechaString);
            if (fechaString.includes(' ')) {
                const hora = fechaString.split(' ')[1].substring(0, 5);
                return hora;
            }
            return fechaString;
        }
        
        const horaLocal = fecha.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'America/Bogota'
        });
        
        return horaLocal;
        
    } catch (error) {
        console.error('Error al convertir fecha:', fechaString, error);
        if (fechaString.includes(' ')) {
            const partes = fechaString.split(' ');
            const [horas, minutos] = partes[1].split(':').map(Number);
            let horaLocal = horas - 5;
            if (horaLocal < 0) horaLocal += 24;
            return `${horaLocal.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
        }
        return fechaString;
    }
}

function actualizarPrecio() {
    const select = document.getElementById('servicio');
    const costoInput = document.getElementById('costo');
    const selectedOption = select.options[select.selectedIndex];
    const precio = selectedOption.getAttribute('data-precio');
    
    if (precio) {
        costoInput.value = precio;
        costoInput.style.background = '#e8f4f8';
    } else {
        costoInput.value = '';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const hayPropinaSelect = document.getElementById('hayPropina');
    const grupoPropina = document.getElementById('grupoPropina');
    const valorPropina = document.getElementById('valorPropina');
    
    hayPropinaSelect.addEventListener('change', function() {
        if (this.value === 'si') {
            grupoPropina.style.display = 'block';
            valorPropina.required = true;
        } else {
            grupoPropina.style.display = 'none';
            valorPropina.required = false;
            valorPropina.value = '';
        }
    });
});

function openTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    const buttons = document.querySelectorAll('.tab');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    buttons.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');

    if (tabName === 'reportes') {
        cargarReportes();
    }
}

document.getElementById('formServicio').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (isProcessing) {
        mostrarToast('Operación en proceso', 'Ya hay una operación en curso. Por favor espera.', 'warning');
        return;
    }
    
    const hayPropina = document.getElementById('hayPropina').value === 'si';
    const propina = hayPropina ? parseFloat(document.getElementById('valorPropina').value || 0) : 0;
    const costoInput = document.getElementById('costo');
    const costoFinal = parseFloat(costoInput.value) || 0;
    
    const data = {
        empleado: document.getElementById('empleado').value,
        servicio: document.getElementById('servicio').value,
        costo: costoFinal,
        metodoPago: document.getElementById('metodoPago').value,
        propina: propina
    };
    
    bloquearSistema('Registrando servicio...');
    
    try {
        const response = await apiFetch('/servicio', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const mensaje = `Costo: ${costoFinal.toLocaleString('es-CO')}${propina > 0 ? ` | Propina: ${propina.toLocaleString('es-CO')}` : ''}`;
            mostrarToast('Servicio registrado', mensaje, 'success');
            e.target.reset();
            document.getElementById('hayPropina').value = 'no';
            document.getElementById('grupoPropina').style.display = 'none';
            costoInput.value = '';
            costoInput.style.background = '#f0f0f0';
            await cargarServicios();
        } else {
            const error = await response.text();
            mostrarToast('Error', `No se pudo registrar el servicio: ${error}`, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error de conexión', 'No se pudo conectar con el servidor', 'error');
    } finally {
        desbloquearSistema();
    }
});

document.getElementById('formGasto').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (isProcessing) {
        mostrarToast('Operación en proceso', 'Ya hay una operación en curso. Por favor espera.', 'warning');
        return;
    }
    
    const data = {
        concepto: document.getElementById('conceptoGasto').value,
        monto: parseFloat(document.getElementById('montoGasto').value)
    };
    
    bloquearSistema('Registrando gasto...');
    
    try {
        const response = await apiFetch('/gasto', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            mostrarToast('Gasto registrado', `${data.concepto} - ${data.monto.toLocaleString('es-CO')}`, 'success');
            e.target.reset();
            await cargarGastos();
        } else {
            const error = await response.text();
            mostrarToast('Error', `No se pudo registrar el gasto: ${error}`, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error de conexión', 'No se pudo conectar con el servidor', 'error');
    } finally {
        desbloquearSistema();
    }
});

document.getElementById('formPrestamo').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (isProcessing) {
        mostrarToast('Operación en proceso', 'Ya hay una operación en curso. Por favor espera.', 'warning');
        return;
    }
    
    const data = {
        prestatario: document.getElementById('prestatario').value,
        concepto: document.getElementById('conceptoPrestamo').value,
        monto: parseFloat(document.getElementById('montoPrestamo').value)
    };
    
    bloquearSistema('Registrando préstamo...');
    
    try {
        const response = await apiFetch('/prestamo', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            mostrarToast('Préstamo registrado', `${data.prestatario} - ${data.monto.toLocaleString('es-CO')}`, 'success');
            e.target.reset();
            await cargarPrestamos();
        } else {
            const error = await response.text();
            mostrarToast('Error', `No se pudo registrar el préstamo: ${error}`, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error de conexión', 'No se pudo conectar con el servidor', 'error');
    } finally {
        desbloquearSistema();
    }
});

async function cargarServicios() {
    try {
        const res = await apiFetch('/servicios');
        const servicios = await res.json();
        const tbody = document.querySelector('#tablaServicios tbody');
        
        if (!servicios || servicios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No hay servicios registrados</td></tr>';
            return;
        }
        
        tbody.innerHTML = servicios.map(s => `
            <tr>
                <td>${convertirAHoraLocal(s.fecha)}</td>
                <td>${s.empleado}</td>
                <td>${s.servicio}</td>
                <td>${parseFloat(s.costo || 0).toLocaleString('es-CO')}</td>
                <td>${s.metodoPago}</td>
                <td>${parseFloat(s.propina || 0).toLocaleString('es-CO')}</td>
                <td><button class="delete-btn" onclick="eliminar('servicio', ${s.id})">Eliminar</button></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error cargando servicios:', error);
        mostrarToast('Error', 'No se pudieron cargar los servicios', 'error');
    }
}

async function cargarGastos() {
    try {
        const res = await apiFetch('/gastos');
        const gastos = await res.json();
        const tbody = document.querySelector('#tablaGastos tbody');
        
        if (!gastos || gastos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No hay gastos registrados</td></tr>';
            return;
        }
        
        tbody.innerHTML = gastos.map(g => `
            <tr>
                <td>${convertirAHoraLocal(g.fecha)}</td>
                <td>${g.concepto}</td>
                <td>${parseFloat(g.monto || 0).toLocaleString('es-CO')}</td>
                <td><button class="delete-btn" onclick="eliminar('gasto', ${g.id})">Eliminar</button></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error cargando gastos:', error);
        mostrarToast('Error', 'No se pudieron cargar los gastos', 'error');
    }
}

async function cargarPrestamos() {
    try {
        const res = await apiFetch('/prestamos');
        const prestamos = await res.json();
        const tbody = document.querySelector('#tablaPrestamos tbody');
        
        if (!prestamos || prestamos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay préstamos registrados</td></tr>';
            return;
        }
        
        tbody.innerHTML = prestamos.map(p => `
            <tr>
                <td>${convertirAHoraLocal(p.fecha)}</td>
                <td>${p.prestatario}</td>
                <td>${p.concepto}</td>
                <td>${parseFloat(p.monto || 0).toLocaleString('es-CO')}</td>
                <td><button class="delete-btn" onclick="eliminar('prestamo', ${p.id})">Eliminar</button></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error cargando préstamos:', error);
        mostrarToast('Error', 'No se pudieron cargar los préstamos', 'error');
    }
}

async function cargarReportes() {
    try {
        const res = await apiFetch('/reportes');
        
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        
        const reportes = await res.json();
        
        console.log('Reportes recibidos:', reportes);

        document.getElementById('statsGenerales').innerHTML = `
        <div class="stat-card">
            <h3>Total Servicios</h3>
            <div class="value">${reportes.totalServicios || 0}</div>
        </div>
        <div class="stat-card">
            <h3>Ingresos Transferencia</h3>
            <div class="value">${(reportes.ingresosTransferencia || 0).toLocaleString('es-CO')}</div>
        </div>
        <div class="stat-card">
            <h3>Total Ganancias</h3>
            <div class="value">${(reportes.ingresosTotales || 0).toLocaleString('es-CO')}</div>
        </div>
        <div class="stat-card" style="background: #fee2e2; border: 2px solid #ef4444;">
            <h3 style="color: #991b1b;">Ganancia Administrador</h3>
            <div class="value" style="color: #dc2626; font-weight: bold;">${(reportes.gananciaNeta || 0).toLocaleString('es-CO')}</div>
        </div>
        `;

        const gananciasEfectivo = reportes.efectivoEnCaja || 0;
        const gananciasTransferencia = reportes.ingresosTransferencia || 0;
        const totalGananciasDisponibles = gananciasEfectivo + gananciasTransferencia;

        document.getElementById('statsCaja').innerHTML = `
            <div class="stat-card caja">
                <h3>Efectivo en Caja</h3>
                <div class="value grande">${gananciasEfectivo.toLocaleString('es-CO')}</div>
                <small>
                    Efectivo: ${(reportes.ingresosEfectivo || 0).toLocaleString('es-CO')}<br>
                    - Gastos: ${(reportes.gastosTotales || 0).toLocaleString('es-CO')}<br>
                    - Préstamos: ${(reportes.prestamosTotales || 0).toLocaleString('es-CO')}
                </small>
            </div>
            <div class="stat-card highlight">
                <h3>Ganancias del Día</h3>
                <div class="value">${totalGananciasDisponibles.toLocaleString('es-CO')}</div>
                <small style="display: block; margin-top: 15px; line-height: 1.8;">
                    Efectivo en caja: ${gananciasEfectivo.toLocaleString('es-CO')}<br>
                    Transferencias: ${gananciasTransferencia.toLocaleString('es-CO')}<br>
                </small>
            </div>
            <div class="stat-card" style="background: #e3f2fd; border: 2px solid #2196f3;">
                <h3 style="color: #0d47a1;">Total Salarios Empleados</h3>
                <div class="value" style="color: #1565c0;">${(reportes.totalSueldosEmpleados || 0).toLocaleString('es-CO')}</div>
                <small style="display: block; margin-top: 10px; color: #1565c0;">
                    Suma de los 5 empleados
                </small>
            </div>
        `;

        const ordenEmpleados = ['David', 'Luis', 'Norwin', 'Sergio', 'Juan'];
        
        let empleadosHTML = '';
        
        if (reportes.porEmpleado && Object.keys(reportes.porEmpleado).length > 0) {
            console.log('Datos por empleado:', reportes.porEmpleado);
            
            const empleadosOrdenados = Object.entries(reportes.porEmpleado).sort((a, b) => {
                const indexA = ordenEmpleados.indexOf(a[0]);
                const indexB = ordenEmpleados.indexOf(b[0]);
                return indexA - indexB;
            });

            empleadosOrdenados.forEach(([empleado, datos]) => {
                const salarioBase = parseFloat(datos.salarioBase || 0);
                const salarioFinal = parseFloat(datos.salarioConPropinas || 0);
                const totalGenerado = parseFloat(datos.total_servicios || 0);
                const aumento = salarioFinal - salarioBase;
                const numSencillos = (datos.num_servicios || 0) - (datos.num_especiales || 0);
                
                if (empleado === 'Juan') {
                    if (datos.num_servicios > 0) {
                        empleadosHTML += `
                            <div class="stat-card empleado">
                                <h3>${empleado}</h3>
                                <div class="value-sueldo">
                                    <span class="salario-final">${salarioFinal.toLocaleString('es-CO')}</span>
                                </div>
                                <div class="detalles">
                                    <div><strong>Servicios totales:</strong> ${datos.num_servicios || 0}</div>
                                    ${(datos.prestamos || 0) > 0 ? `<div class="prestamo"><strong>Préstamo:</strong> -${(datos.prestamos || 0).toLocaleString('es-CO')}</div>` : ''}
                                </div>
                            </div>
                        `;
                    }
                } else {
                    if (datos.num_servicios > 0) {
                        empleadosHTML += `
                            <div class="stat-card empleado">
                                <h3>${empleado}</h3>
                                <div class="value-sueldo">
                                    <span class="salario-base">${salarioBase.toLocaleString('es-CO')}</span>
                                    <span class="flecha">➜</span>
                                    <span class="salario-final">${salarioFinal.toLocaleString('es-CO')}</span>
                                </div>
                                <div class="detalles">
                                    <div><strong>Total generado:</strong> ${totalGenerado.toLocaleString('es-CO')}</div>
                                    <div><strong>Servicios:</strong> ${datos.num_servicios || 0} (${numSencillos} simples, ${datos.num_especiales || 0} especiales)</div>
                                    <div class="propina"><strong>Propinas:</strong> +${parseFloat(datos.propinaTotal || 0).toLocaleString('es-CO')}</div>
                                    <div class="aumento"><strong>Aumento:</strong> +${aumento.toLocaleString('es-CO')}</div>
                                    ${(datos.prestamos || 0) > 0 ? `<div class="prestamo"><strong>Préstamo:</strong> -${(datos.prestamos || 0).toLocaleString('es-CO')}</div>` : ''}
                                </div>
                            </div>
                        `;
                    }
                }
            });
            
            document.getElementById('statsEmpleados').innerHTML = empleadosHTML;
        } else {
            console.log('No hay datos de empleados');
            document.getElementById('statsEmpleados').innerHTML = '<p style="text-align: center; color: #666;">No hay datos de empleados</p>';
        }
        
    } catch (error) {
        console.error('Error cargando reportes:', error);
        mostrarToast('Error', 'No se pudieron cargar los reportes: ' + error.message, 'error');
        
        document.getElementById('statsEmpleados').innerHTML = '<p style="text-align: center; color: #c53030;">Error al cargar información de empleados</p>';
    }
}

async function eliminar(tipo, id) {
    if (isProcessing) {
        mostrarToast('Operación en proceso', 'Ya hay una operación en curso. Por favor espera.', 'warning');
        return;
    }
    
    const confirmado = await mostrarConfirmacion(
        'Confirmar eliminación',
        '¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.'
    );
    
    if (!confirmado) return;
    
    bloquearSistema('Eliminando registro...');
    
    try {
        const response = await apiFetch(`/${tipo}/${id}`, { method: 'DELETE' });
        
        if (response.ok) {
            mostrarToast('Registro eliminado', 'El registro se eliminó correctamente', 'success');
            if (tipo === 'servicio') await cargarServicios();
            else if (tipo === 'gasto') await cargarGastos();
            else if (tipo === 'prestamo') await cargarPrestamos();
        } else {
            const error = await response.text();
            mostrarToast('Error', `No se pudo eliminar el registro: ${error}`, 'error');
        }
    } catch (error) {
        console.error('Error eliminando:', error);
        mostrarToast('Error de conexión', 'No se pudo conectar con el servidor', 'error');
    } finally {
        desbloquearSistema();
    }
}

async function cerrarDia() {
    if (isProcessing) {
        mostrarToast('Operación en proceso', 'Ya hay una operación en curso. Por favor espera.', 'warning');
        return;
    }
    
    const confirmado = await mostrarConfirmacion(
        'Cerrar día',
        '¿Estás seguro de cerrar el día? Esto eliminará TODOS los registros permanentemente.'
    );
    
    if (!confirmado) return;
    
    bloquearSistema('Cerrando día...');
    
    try {
        const response = await apiFetch('/cerrar-dia', {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarToast('Día cerrado exitosamente', result.mensaje || 'Todos los registros han sido eliminados', 'success');
            await cargarServicios();
            await cargarGastos();
            await cargarPrestamos();
            await cargarReportes();
        } else {
            mostrarToast('Error', result.error || 'Error desconocido', 'error');
        }
    } catch (error) {
        console.error('Error cerrando día:', error);
        mostrarToast('Error de conexión', 'No se pudo conectar con el servidor', 'error');
    } finally {
        desbloquearSistema();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    cargarServicios();
    cargarGastos();
    cargarPrestamos();
});

