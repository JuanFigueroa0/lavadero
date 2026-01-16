const API_BASE_URL = 'https://lavadero-ubdd.onrender.com/api';

// Función para hacer fetch con la URL base
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

function actualizarPrecio() {
    const select = document.getElementById('servicio');
    const costoInput = document.getElementById('costo');
    const selectedOption = select.options[select.selectedIndex];
    const precio = selectedOption.getAttribute('data-precio');
    
    if (precio) {
        costoInput.value = precio;
        costoInput.style.background = '#e8f4f8'; // Color neutro para indicar editable
    } else {
        costoInput.value = '';
    }
}

// Control de propina
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

// Registrar Servicio
document.getElementById('formServicio').addEventListener('submit', async (e) => {
    e.preventDefault();
    const hayPropina = document.getElementById('hayPropina').value === 'si';
    const propina = hayPropina ? parseFloat(document.getElementById('valorPropina').value || 0) : 0;
    const costoInput = document.getElementById('costo');
    const costoFinal = parseFloat(costoInput.value) || 0;
    
    const data = {
        empleado: document.getElementById('empleado').value,
        servicio: document.getElementById('servicio').value,
        costo: costoFinal,  // Usa el valor editado por el usuario
        metodoPago: document.getElementById('metodoPago').value,
        propina: propina
    };
    
    try {
        const response = await apiFetch('/servicio', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            alert(`Servicio registrado exitosamente\nCosto final: $${costoFinal.toLocaleString('es-CO')}${propina > 0 ? ` + Propina: $${propina.toLocaleString('es-CO')}` : ''}`);
            e.target.reset();
            document.getElementById('hayPropina').value = 'no';
            document.getElementById('grupoPropina').style.display = 'none';
            costoInput.value = '';
            costoInput.style.background = '#f0f0f0';
            cargarServicios();
        } else {
            const error = await response.text();
            alert(`Error al registrar servicio: ${error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión al registrar servicio');
    }
});

// Registrar Gasto
document.getElementById('formGasto').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        concepto: document.getElementById('conceptoGasto').value,
        monto: parseFloat(document.getElementById('montoGasto').value)
    };
    
    try {
        const response = await apiFetch('/gasto', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            alert('Gasto registrado exitosamente');
            e.target.reset();
            cargarGastos();
        } else {
            const error = await response.text();
            alert(`Error al registrar gasto: ${error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión al registrar gasto');
    }
});

// Registrar Préstamo
document.getElementById('formPrestamo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        prestatario: document.getElementById('prestatario').value,
        concepto: document.getElementById('conceptoPrestamo').value,
        monto: parseFloat(document.getElementById('montoPrestamo').value)
    };
    
    try {
        const response = await apiFetch('/prestamo', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            alert('Préstamo registrado exitosamente');
            e.target.reset();
            cargarPrestamos();
        } else {
            const error = await response.text();
            alert(`Error al registrar préstamo: ${error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión al registrar préstamo');
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
                <td>${s.fecha || 'N/A'}</td>
                <td>${s.empleado}</td>
                <td>${s.servicio}</td>
                <td>$${parseFloat(s.costo || 0).toLocaleString('es-CO')}</td>
                <td>${s.metodoPago}</td>
                <td>$${parseFloat(s.propina || 0).toLocaleString('es-CO')}</td>
                <td><button class="delete-btn" onclick="eliminar('servicio', ${s.id})">Eliminar</button></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error cargando servicios:', error);
        alert('Error al cargar servicios');
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
                <td>${g.fecha || 'N/A'}</td>
                <td>${g.concepto}</td>
                <td>$${parseFloat(g.monto || 0).toLocaleString('es-CO')}</td>
                <td><button class="delete-btn" onclick="eliminar('gasto', ${g.id})">Eliminar</button></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error cargando gastos:', error);
        alert('Error al cargar gastos');
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
                <td>${p.fecha || 'N/A'}</td>
                <td>${p.prestatario}</td>
                <td>${p.concepto}</td>
                <td>$${parseFloat(p.monto || 0).toLocaleString('es-CO')}</td>
                <td><button class="delete-btn" onclick="eliminar('prestamo', ${p.id})">Eliminar</button></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error cargando préstamos:', error);
        alert('Error al cargar préstamos');
    }
}

async function cargarReportes() {
    try {
        const res = await apiFetch('/reportes');
        const reportes = await res.json();

        document.getElementById('statsGenerales').innerHTML = `
            <div class="stat-card">
                <h3>Total de Servicios Realizados</h3>
                <div class="value">${reportes.totalServicios || 0}</div>
            </div>
            <div class="stat-card">
                <h3>Ingresos en Efectivo</h3>
                <div class="value">$${(reportes.ingresosEfectivo || 0).toLocaleString('es-CO')}</div>
            </div>
            <div class="stat-card">
                <h3>Ingresos por Transferencia</h3>
                <div class="value">$${(reportes.ingresosTransferencia || 0).toLocaleString('es-CO')}</div>
            </div>
            <div class="stat-card">
                <h3>Ingresos Totales</h3>
                <div class="value">$${(reportes.ingresosTotales || 0).toLocaleString('es-CO')}</div>
            </div>
            <div class="stat-card">
                <h3>Ganancia Neta</h3>
                <div class="value">$${(reportes.gananciaNeta || 0).toLocaleString('es-CO')}</div>
            </div>
        `;

        document.getElementById('statsCaja').innerHTML = `
            <div class="stat-card" style="background: linear-gradient(135deg, #276749 0%, #22543d 100%);">
                <h3>Efectivo Disponible en Caja</h3>
                <div class="value">$${(reportes.efectivoEnCaja || 0).toLocaleString('es-CO')}</div>
                <small style="opacity: 0.9; display: block; margin-top: 10px;">
                    Efectivo: $${(reportes.ingresosEfectivo || 0).toLocaleString('es-CO')}<br>
                    - Gastos: $${(reportes.gastosTotales || 0).toLocaleString('es-CO')}<br>
                    - Préstamos: $${(reportes.prestamosTotales || 0).toLocaleString('es-CO')}
                </small>
            </div>
        `;

        // ✅ CAMBIO PRINCIPAL: Stats de empleados con salario base → final + propinas
        if (document.getElementById('statsEmpleados')) {
            let empleadosHTML = '';
            if (reportes.porEmpleado) {
                // Primero los 4 empleados principales
                empleadosHTML = Object.entries(reportes.porEmpleado)
                    .filter(([empleado]) => empleado !== 'Juan')
                    .map(([empleado, datos]) => {
                        const salarioBase = parseFloat(datos.salarioBase || 0);
                        const salarioFinal = parseFloat(datos.salarioConPropinas || 0);
                        const aumento = salarioFinal - salarioBase;
                        const numSencillos = (datos.num_servicios || 0) - (datos.num_especiales || 0);
                        
                        return `
                            <div class="stat-card" style="background: linear-gradient(135deg, #059669 0%, #047857 100%);">
                                <h3>${empleado}</h3>
                                <div class="value">$${salarioBase.toLocaleString('es-CO')} 
                                    <span style="color: #10b981; font-size: 1.4em; font-weight: bold;">→ $${salarioFinal.toLocaleString('es-CO')}</span>
                                </div>
                                <small style="opacity: 0.9; display: block; margin-top: 10px;">
                                    Servicios sencillos: ${numSencillos}<br>
                                    Servicios especiales: ${datos.num_especiales || 0}<br>
                                    <strong style="color: #fff;">Propinas: +$${parseFloat(datos.propinaTotal || 0).toLocaleString('es-CO')}</strong><br>
                                    Aumento total: <strong style="color: #10b981;">+$${aumento.toLocaleString('es-CO')}</strong><br>
                                    Préstamos: <span style="color: #f87171;">-$${(datos.prestamos || 0).toLocaleString('es-CO')}</span>
                                </small>
                            </div>
                        `;
                    }).join('');

                // Juan al FINAL (actualizado)
                const juan = reportes.porEmpleado['Juan'];
                if (juan) {
                    const salarioBaseJuan = parseFloat(juan.salarioBase || 0);
                    const salarioFinalJuan = parseFloat(juan.salarioConPropinas || 0);
                    
                    empleadosHTML += `
                        <div class="stat-card" style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); border: 2px solid #a78bfa;">
                            <h3>Juan</h3>
                            <div class="value">${reportes.totalServicios || 0} servicios totales</div>
                            <small style="opacity: 0.9; display: block; margin-top: 10px;">
                                <strong style="color: #fff;">Base: $${salarioBaseJuan.toLocaleString('es-CO')} → Final: $${salarioFinalJuan.toLocaleString('es-CO')}</strong><br>
                                Préstamos: <span style="color: #f87171;">-$${(juan.prestamos || 0).toLocaleString('es-CO')}</span>
                            </small>
                        </div>
                    `;
                }
            }
            
            document.getElementById('statsEmpleados').innerHTML = empleadosHTML;
        }
    } catch (error) {
        console.error('Error cargando reportes:', error);
        alert('Error al cargar reportes');
    }
}

async function eliminar(tipo, id) {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;
    
    try {
        const response = await apiFetch(`/${tipo}/${id}`, { method: 'DELETE' });
        
        if (response.ok) {
            alert('Registro eliminado exitosamente');
            if (tipo === 'servicio') cargarServicios();
            else if (tipo === 'gasto') cargarGastos();
            else if (tipo === 'prestamo') cargarPrestamos();
        } else {
            const error = await response.text();
            alert(`Error al eliminar registro: ${error}`);
        }
    } catch (error) {
        console.error('Error eliminando:', error);
        alert('Error de conexión al eliminar registro');
    }
}

async function cerrarDia() {
    if (!confirm('Cerrar el dia')) {
        return;
    }
    
    try {
        const response = await apiFetch('/cerrar-dia', {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Día cerrado exitosamente!\n\n' + (result.mensaje || ''));
            cargarServicios();
            cargarGastos();
            cargarPrestamos();
            cargarReportes();
        } else {
            alert('❌ Error: ' + (result.error || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error cerrando día:', error);
        alert('❌ Error de conexión al cerrar día');
    }
}

// Cargar datos al inicio
window.addEventListener('DOMContentLoaded', () => {
    cargarServicios();
    cargarGastos();
    cargarPrestamos();
});
