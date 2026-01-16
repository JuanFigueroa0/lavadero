const API_BASE_URL = 'https://lavadero-ubdd.onrender.com/api';

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
        
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        
        const reportes = await res.json();
        
        console.log('Reportes recibidos:', reportes);

        // STATS GENERALES
        document.getElementById('statsGenerales').innerHTML = `
            <div class="stat-card">
                <h3>Total Servicios</h3>
                <div class="value">${reportes.totalServicios || 0}</div>
            </div>
            <div class="stat-card">
                <h3>Ingresos Efectivo</h3>
                <div class="value">$${(reportes.ingresosEfectivo || 0).toLocaleString('es-CO')}</div>
            </div>
            <div class="stat-card">
                <h3>Ingresos Transferencia</h3>
                <div class="value">$${(reportes.ingresosTransferencia || 0).toLocaleString('es-CO')}</div>
            </div>
            <div class="stat-card">
                <h3>Gastos Fijos</h3>
                <div class="value">$${(reportes.gastosFijos || 130000).toLocaleString('es-CO')}</div>
            </div>
            <div class="stat-card highlight">
                <h3>Ganancia Neta Final</h3>
                <div class="value ganancia">$${(reportes.gananciaNeta || 0).toLocaleString('es-CO')}</div>
            </div>
        `;

        // Caja
        document.getElementById('statsCaja').innerHTML = `
            <div class="stat-card caja">
                <h3>Efectivo en Caja</h3>
                <div class="value grande">$${(reportes.efectivoEnCaja || 0).toLocaleString('es-CO')}</div>
                <small>
                    Efectivo: $${(reportes.ingresosEfectivo || 0).toLocaleString('es-CO')}<br>
                    - Gastos: $${(reportes.gastosTotales || 0).toLocaleString('es-CO')}<br>
                    - Préstamos: $${(reportes.prestamosTotales || 0).toLocaleString('es-CO')}
                </small>
            </div>
        `;

        // Orden personalizado: David, Luis, Norwin, Sergio, Juan al final
        const ordenEmpleados = ['David', 'Luis', 'Norwin', 'Sergio', 'Juan'];
        
        let empleadosHTML = '';
        
        if (reportes.porEmpleado && Object.keys(reportes.porEmpleado).length > 0) {
            console.log('Datos por empleado:', reportes.porEmpleado);
            
            // Ordenar empleados según el array ordenEmpleados
            const empleadosOrdenados = Object.entries(reportes.porEmpleado).sort((a, b) => {
                const indexA = ordenEmpleados.indexOf(a[0]);
                const indexB = ordenEmpleados.indexOf(b[0]);
                return indexA - indexB;
            });

            empleadosOrdenados.forEach(([empleado, datos]) => {
                const salarioBase = parseFloat(datos.salarioBase || 0);
                const salarioFinal = parseFloat(datos.salarioConPropinas || 0);
                const aumento = salarioFinal - salarioBase;
                const numSencillos = (datos.num_servicios || 0) - (datos.num_especiales || 0);
                
                // JUAN - Versión simplificada
                if (empleado === 'Juan') {
                    empleadosHTML += `
                        <div class="stat-card empleado">
                            <h3>${empleado}</h3>
                            <div class="value-sueldo">
                                <span class="salario-final">$${salarioFinal.toLocaleString('es-CO')}</span>
                            </div>
                            <div class="detalles">
                                <div><strong>Servicios totales:</strong> ${datos.num_servicios || 0}</div>
                                ${(datos.prestamos || 0) > 0 ? `<div class="prestamo"><strong>Préstamo:</strong> -$${(datos.prestamos || 0).toLocaleString('es-CO')}</div>` : ''}
                            </div>
                        </div>
                    `;
                } else {
                    // OTROS EMPLEADOS - Versión completa
                    empleadosHTML += `
                        <div class="stat-card empleado">
                            <h3>${empleado}</h3>
                            <div class="value-sueldo">
                                <span class="salario-base">$${salarioBase.toLocaleString('es-CO')}</span>
                                <span class="flecha">➜</span>
                                <span class="salario-final">$${salarioFinal.toLocaleString('es-CO')}</span>
                            </div>
                            <div class="detalles">
                                <div><strong>Servicios:</strong> ${datos.num_servicios || 0} (${numSencillos} simples, ${datos.num_especiales || 0} especiales)</div>
                                <div class="propina"><strong>Propinas:</strong> +$${parseFloat(datos.propinaTotal || 0).toLocaleString('es-CO')}</div>
                                <div class="aumento"><strong>Aumento:</strong> +$${aumento.toLocaleString('es-CO')}</div>
                                ${(datos.prestamos || 0) > 0 ? `<div class="prestamo"><strong>Préstamo:</strong> -$${(datos.prestamos || 0).toLocaleString('es-CO')}</div>` : ''}
                            </div>
                        </div>
                    `;
                }
            });
            
            document.getElementById('statsEmpleados').innerHTML = empleadosHTML;
        } else {
            console.log('No hay datos de empleados');
            document.getElementById('statsEmpleados').innerHTML = '<p style="text-align: center; color: #666;">No hay datos de empleados</p>';
        }
        
    } catch (error) {
        console.error('Error cargando reportes:', error);
        alert('Error al cargar reportes: ' + error.message);
        
        // Mostrar mensaje de error en lugar de dejar vacío
        document.getElementById('statsEmpleados').innerHTML = '<p style="text-align: center; color: #c53030;">Error al cargar información de empleados</p>';
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
    if (!confirm('¿Cerrar el día? Esto eliminará TODOS los registros.')) {
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
            alert('Error: ' + (result.error || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error cerrando día:', error);
        alert('Error de conexión al cerrar día');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    cargarServicios();
    cargarGastos();
    cargarPrestamos();
});
