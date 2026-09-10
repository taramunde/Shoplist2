// Catálogo de productos organizado por categorías.
// Cada producto tiene un nombre y una unidad de medida por defecto,
// pero la unidad se puede cambiar libremente al añadirlo a la lista.

const UNIDADES = ["ud", "kg", "g", "l", "ml", "docena", "brick", "lata", "bote", "paquete", "bolsa", "barra"];

const CATALOGO = [
  {
    categoria: "Fruta y verdura",
    productos: [
      { nombre: "Tomates", unidad: "kg" },
      { nombre: "Patatas", unidad: "kg" },
      { nombre: "Cebollas", unidad: "kg" },
      { nombre: "Ajos", unidad: "ud" },
      { nombre: "Pimientos", unidad: "kg" },
      { nombre: "Lechuga", unidad: "ud" },
      { nombre: "Zanahorias", unidad: "kg" },
      { nombre: "Manzanas", unidad: "kg" },
      { nombre: "Plátanos", unidad: "kg" },
      { nombre: "Naranjas", unidad: "kg" },
      { nombre: "Limones", unidad: "kg" },
      { nombre: "Aguacates", unidad: "ud" }
    ]
  },
  {
    categoria: "Carnicería",
    productos: [
      { nombre: "Pechuga de pollo", unidad: "kg" },
      { nombre: "Contramuslos de pollo", unidad: "kg" },
      { nombre: "Carne picada", unidad: "kg" },
      { nombre: "Filetes de ternera", unidad: "kg" },
      { nombre: "Lomo de cerdo", unidad: "kg" },
      { nombre: "Chorizo", unidad: "paquete" },
      { nombre: "Jamón cocido", unidad: "paquete" },
      { nombre: "Jamón serrano", unidad: "paquete" }
    ]
  },
  {
    categoria: "Pescadería",
    productos: [
      { nombre: "Merluza", unidad: "kg" },
      { nombre: "Salmón", unidad: "kg" },
      { nombre: "Gambas", unidad: "kg" },
      { nombre: "Atún en lata", unidad: "lata" },
      { nombre: "Bacalao", unidad: "kg" }
    ]
  },
  {
    categoria: "Lácteos y huevos",
    productos: [
      { nombre: "Leche", unidad: "brick" },
      { nombre: "Huevos", unidad: "docena" },
      { nombre: "Yogures", unidad: "paquete" },
      { nombre: "Queso curado", unidad: "paquete" },
      { nombre: "Queso fresco", unidad: "paquete" },
      { nombre: "Mantequilla", unidad: "paquete" },
      { nombre: "Nata", unidad: "brick" }
    ]
  },
  {
    categoria: "Panadería",
    productos: [
      { nombre: "Pan", unidad: "barra" },
      { nombre: "Pan de molde", unidad: "paquete" },
      { nombre: "Croissants", unidad: "paquete" },
      { nombre: "Magdalenas", unidad: "paquete" }
    ]
  },
  {
    categoria: "Despensa",
    productos: [
      { nombre: "Arroz", unidad: "kg" },
      { nombre: "Pasta", unidad: "paquete" },
      { nombre: "Lentejas", unidad: "paquete" },
      { nombre: "Garbanzos", unidad: "bote" },
      { nombre: "Aceite de oliva", unidad: "l" },
      { nombre: "Azúcar", unidad: "kg" },
      { nombre: "Harina", unidad: "kg" },
      { nombre: "Sal", unidad: "paquete" },
      { nombre: "Tomate frito", unidad: "lata" },
      { nombre: "Café", unidad: "paquete" },
      { nombre: "Galletas", unidad: "paquete" },
      { nombre: "Cereales", unidad: "paquete" }
    ]
  },
  {
    categoria: "Congelados",
    productos: [
      { nombre: "Verdura congelada", unidad: "bolsa" },
      { nombre: "Pescado congelado", unidad: "paquete" },
      { nombre: "Pizza congelada", unidad: "ud" },
      { nombre: "Helado", unidad: "paquete" }
    ]
  },
  {
    categoria: "Bebidas",
    productos: [
      { nombre: "Agua", unidad: "brick" },
      { nombre: "Zumo", unidad: "brick" },
      { nombre: "Refrescos", unidad: "l" },
      { nombre: "Cerveza", unidad: "paquete" },
      { nombre: "Vino", unidad: "ud" }
    ]
  },
  {
    categoria: "Limpieza y hogar",
    productos: [
      { nombre: "Detergente", unidad: "l" },
      { nombre: "Lavavajillas", unidad: "l" },
      { nombre: "Papel higiénico", unidad: "paquete" },
      { nombre: "Papel de cocina", unidad: "paquete" },
      { nombre: "Bolsas de basura", unidad: "paquete" },
      { nombre: "Lejía", unidad: "l" },
      { nombre: "Estropajos", unidad: "paquete" }
    ]
  },
  {
    categoria: "Higiene personal",
    productos: [
      { nombre: "Gel de ducha", unidad: "ud" },
      { nombre: "Champú", unidad: "ud" },
      { nombre: "Pasta de dientes", unidad: "ud" },
      { nombre: "Desodorante", unidad: "ud" },
      { nombre: "Papel de baño", unidad: "paquete" }
    ]
  },
  {
    categoria: "Bebé",
    productos: [
      { nombre: "Pañales", unidad: "paquete" },
      { nombre: "Toallitas", unidad: "paquete" },
      { nombre: "Leche infantil", unidad: "ud" }
    ]
  },
  {
    categoria: "Mascotas",
    productos: [
      { nombre: "Pienso", unidad: "kg" },
      { nombre: "Latas para mascota", unidad: "lata" },
      { nombre: "Arena para gatos", unidad: "kg" }
    ]
  }
];
