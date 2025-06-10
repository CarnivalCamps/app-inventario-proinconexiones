INSERT INTO tipos_movimiento (nombre_tipo, efecto_stock) VALUES ('Entrada por Compra', 1) ON CONFLICT (nombre_tipo) DO NOTHING;
INSERT INTO tipos_movimiento (nombre_tipo, efecto_stock) VALUES ('Ajuste Positivo Inventario', 1) ON CONFLICT (nombre_tipo) DO NOTHING;
-- Y para el futuro:
INSERT INTO tipos_movimiento (nombre_tipo, efecto_stock) VALUES ('Salida por Venta', -1) ON CONFLICT (nombre_tipo) DO NOTHING;
INSERT INTO tipos_movimiento (nombre_tipo, efecto_stock) VALUES ('Baja por Merma', -1) ON CONFLICT (nombre_tipo) DO NOTHING;
INSERT INTO tipos_movimiento (nombre_tipo, efecto_stock) VALUES ('Ajuste Negativo Inventario', -1) ON CONFLICT (nombre_tipo) DO NOTHING;