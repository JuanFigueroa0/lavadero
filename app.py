from flask import Flask, render_template, request, jsonify
from datetime import datetime
import mysql.connector
from config import DB_CONFIG
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

def get_db_connection():
    """Obtiene una conexión a la base de datos"""
    try:
        conn = mysql.connector.connect(
            host=DB_CONFIG['host'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            database=DB_CONFIG['database'],
            port=DB_CONFIG['port']
        )
        return conn
    except mysql.connector.Error as err:
        print(f"Error de conexión a BD: {err}")
        return None


def formatear_hora_desde_fecha(valor):
    """Convierte un datetime o string de fecha a solo HH:MM."""
    if valor is None:
        return ''
    if isinstance(valor, datetime):
        return valor.strftime('%H:%M')
    try:
        dt = datetime.strptime(str(valor), '%Y-%m-%d %H:%M:%S')
        return dt.strftime('%H:%M')
    except Exception:
        return str(valor)


@app.route('/')
return jsonify({
        "status": "OK",
        "message": "🚗 Lavadero API activa - Frontend en GitHub Pages",
        "version": "1.0",
        "endpoints": {
            "POST /api/servicio": "Registrar servicio",
            "GET /api/servicios": "Listar servicios", 
            "POST /api/gasto": "Registrar gasto",
            "GET /api/gastos": "Listar gastos",
            "POST /api/prestamo": "Registrar préstamo",
            "GET /api/prestamos": "Listar préstamos",
            "GET /api/reportes": "Estadísticas",
            "POST /api/cerrar-dia": "Resetear día"
        }
    })

@app.route('/api/cerrar-dia', methods=['POST'])
def cerrar_dia():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Conexión a BD fallida'}), 500
        
        cursor = conn.cursor()
        
        # Truncar todas las tablas (resetea AUTO_INCREMENT también)
        tablas = ['servicios', 'gastos', 'prestamos']
        for tabla in tablas:
            cursor.execute(f"TRUNCATE TABLE {tabla}")
            print(f"Tabla '{tabla}' truncada exitosamente")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'success': True, 'mensaje': '¡Día cerrado! Todas las tablas han sido reseteadas.'})
    except Exception as e:
        print(f"Error al cerrar día: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500



@app.route('/api/servicio', methods=['POST'])
def agregar_servicio():
    try:
        servicio = request.json
        fecha = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Conexión a BD fallida'}), 500
        
        cursor = conn.cursor()
        query = """
        INSERT INTO servicios (fecha, empleado, servicio, costo, metodoPago)
        VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            fecha,
            servicio['empleado'],
            servicio['servicio'],
            servicio['costo'],
            servicio['metodoPago']
        ))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error en agregar_servicio: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/gasto', methods=['POST'])
def agregar_gasto():
    try:
        gasto = request.json
        fecha = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Conexión a BD fallida'}), 500
        
        cursor = conn.cursor()
        query = """
        INSERT INTO gastos (fecha, concepto, monto)
        VALUES (%s, %s, %s)
        """
        cursor.execute(query, (fecha, gasto['concepto'], gasto['monto']))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error en agregar_gasto: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/prestamo', methods=['POST'])
def agregar_prestamo():
    try:
        prestamo = request.json
        fecha = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Conexión a BD fallida'}), 500
        
        cursor = conn.cursor()
        query = """
        INSERT INTO prestamos (fecha, prestatario, concepto, monto)
        VALUES (%s, %s, %s, %s)
        """
        cursor.execute(query, (fecha, prestamo['prestatario'], prestamo['concepto'], prestamo['monto']))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error en agregar_prestamo: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/servicios')
def obtener_servicios():
    try:
        conn = get_db_connection()
        if not conn:
            print("No se pudo conectar a la BD")
            return jsonify([]), 500
        
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM servicios ORDER BY id DESC")
        servicios = cursor.fetchall()
        cursor.close()
        conn.close()
        print(f"Servicios obtenidos: {len(servicios)}")

        for s in servicios:
            s['fecha'] = formatear_hora_desde_fecha(s.get('fecha'))

        return jsonify(servicios)
    except Exception as e:
        print(f"Error en obtener_servicios: {e}")
        return jsonify([]), 500


@app.route('/api/gastos')
def obtener_gastos():
    try:
        conn = get_db_connection()
        if not conn:
            print("No se pudo conectar a la BD")
            return jsonify([]), 500
        
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM gastos ORDER BY id DESC")
        gastos = cursor.fetchall()
        cursor.close()
        conn.close()
        print(f"Gastos obtenidos: {len(gastos)}")

        for g in gastos:
            g['fecha'] = formatear_hora_desde_fecha(g.get('fecha'))

        return jsonify(gastos)
    except Exception as e:
        print(f"Error en obtener_gastos: {e}")
        return jsonify([]), 500


@app.route('/api/prestamos')
def obtener_prestamos():
    try:
        conn = get_db_connection()
        if not conn:
            print("No se pudo conectar a la BD")
            return jsonify([]), 500
        
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM prestamos ORDER BY id DESC")
        prestamos = cursor.fetchall()
        cursor.close()
        conn.close()
        print(f"Préstamos obtenidos: {len(prestamos)}")

        for p in prestamos:
            p['fecha'] = formatear_hora_desde_fecha(p.get('fecha'))

        return jsonify(prestamos)
    except Exception as e:
        print(f"Error en obtener_prestamos: {e}")
        return jsonify([]), 500


@app.route('/api/reportes')
def obtener_reportes():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Conexión a BD fallida'}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM servicios")
        servicios = cursor.fetchall()
        
        cursor.execute("SELECT * FROM gastos")
        gastos = cursor.fetchall()
        
        cursor.execute("SELECT * FROM prestamos")
        prestamos = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        ingresos_efectivo = sum(float(s['costo']) for s in servicios if s['metodoPago'] == 'efectivo')
        ingresos_transferencia = sum(float(s['costo']) for s in servicios if s['metodoPago'] == 'transferencia')
        ingresos_totales = ingresos_efectivo + ingresos_transferencia
        gastos_totales = sum(float(g['monto']) for g in gastos)
        prestamos_totales = sum(float(p['monto']) for p in prestamos)
        
        salarios = {}
        dinero_caja_empleados = 0
        
        for empleado in ['David', 'Luis', 'Norwin', 'Sergio']:
            servicios_emp = [s for s in servicios if s.get('empleado') == empleado]
            prestamos_emp = sum(float(p['monto']) for p in prestamos if p.get('prestatario') == empleado)
            
            if len(servicios_emp) == 0:
                salarios[empleado] = {
                    'total_servicios': 0,
                    'num_servicios': 0,
                    'num_especiales': 0,
                    'salario': -prestamos_emp if prestamos_emp > 0 else 0,
                    'prestamos': prestamos_emp
                }
                continue
            
            total_servicios = sum(float(s['costo']) for s in servicios_emp)
            num_servicios = len(servicios_emp)
            num_especiales = sum(
                1 for s in servicios_emp 
                if ('Cera' in s.get('servicio', '') or 'Motor' in s.get('servicio', '') or 'Camioneta' in s.get('servicio', '')) 
                and 'Alto CC' not in s.get('servicio', '')
            )
            num_normales = num_servicios - num_especiales
            
            descuento_normales = float(num_normales * 1000)
            descuento_especiales = float(num_especiales * 2000)
            descuento_total = descuento_normales + descuento_especiales
            
            base_descontada = total_servicios - descuento_total
            base_40_porciento = base_descontada * 0.40
            
            if empleado == 'David':
                devolucion_normales = float(num_normales * 1000)
                devolucion_especiales = float(num_especiales * 1000)
                salario = base_40_porciento + devolucion_normales + devolucion_especiales - prestamos_emp
            else:
                salario = base_40_porciento - prestamos_emp
            
            dinero_caja_empleados += salario
            
            salarios[empleado] = {
                'total_servicios': float(total_servicios),
                'num_servicios': num_servicios,
                'num_especiales': num_especiales,
                'salario': float(salario),
                'prestamos': float(prestamos_emp)
            }
        
        efectivo_en_caja = ingresos_efectivo - gastos_totales - prestamos_totales
        ganancia_neta = ingresos_totales - gastos_totales - prestamos_totales - 130000
        total_servicios_realizados = len(servicios)
        
        return jsonify({
            'ingresosEfectivo': float(ingresos_efectivo),
            'ingresosTransferencia': float(ingresos_transferencia),
            'ingresosTotales': float(ingresos_totales),
            'gastosTotales': float(gastos_totales),
            'prestamosTotales': float(prestamos_totales),
            'gananciaNeta': float(ganancia_neta),
            'efectivoEnCaja': float(efectivo_en_caja),
            'dineroCajaEmpleados': float(dinero_caja_empleados),
            'totalServicios': total_servicios_realizados,
            'porEmpleado': salarios
        })
    except Exception as e:
        import traceback
        print(f"Error en obtener_reportes: {e}")
        print(traceback.format_exc())
        return jsonify({'error': f'Error al obtener reportes: {str(e)}'}), 500


@app.route('/api/<tipo>/<int:id>', methods=['DELETE'])
def eliminar(tipo, id):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Conexión a BD fallida'}), 500
        
        cursor = conn.cursor()
        
        if tipo == 'servicio':
            cursor.execute("DELETE FROM servicios WHERE id = %s", (id,))
        elif tipo == 'gasto':
            cursor.execute("DELETE FROM gastos WHERE id = %s", (id,))
        elif tipo == 'prestamo':
            cursor.execute("DELETE FROM prestamos WHERE id = %s", (id,))
        else:
            return jsonify({'error': 'Tipo inválido'}), 400
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error en eliminar: {e}")
        return jsonify({'error': f'Error al eliminar: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)


