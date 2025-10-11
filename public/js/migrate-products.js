// Script para migrar productos a Firestore
import { db } from './firebase-config.js';
import { collection, addDoc, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Productos a migrar (los mismos de products.js)
const PRODUCTS = [
    { id: 1, nombre: "Alimento Premium para Perros", categoria: "perros", subcategoria: "alimento", precio: 25000, descripcion: "Alimento balanceado para perros adultos", imagen: "https://i.ibb.co/S7Jj4r7/prod-1.jpg", stock: 50 },
    { id: 2, nombre: "Alimento Húmedo para Gatos", categoria: "gatos", subcategoria: "alimento", precio: 15000, descripcion: "Alimento húmedo premium para gatos", imagen: "https://i.ibb.co/d7z1y1C/prod-2.jpg", stock: 30 },
    { id: 3, nombre: "Antiparasitario para Perros", categoria: "perros", subcategoria: "salud", precio: 35000, descripcion: "Tratamiento antiparasitario mensual", imagen: "https://i.ibb.co/R2qJ2X4/prod-3.jpg", stock: 20 },
    { id: 4, nombre: "Antiparasitario para Gatos", categoria: "gatos", subcategoria: "salud", precio: 30000, descripcion: "Tratamiento antiparasitario para gatos", imagen: "https://i.ibb.co/M9F5D21/prod-4.jpg", stock: 25 },
    { id: 5, nombre: "Juguete para Perros", categoria: "perros", subcategoria: "juguetes", precio: 12000, descripcion: "Juguete interactivo resistente", imagen: "https://i.ibb.co/S7Jj4r7/prod-1.jpg", stock: 40 },
    { id: 6, nombre: "Rascador para Gatos", categoria: "gatos", subcategoria: "juguetes", precio: 45000, descripcion: "Rascador de múltiples niveles", imagen: "https://i.ibb.co/d7z1y1C/prod-2.jpg", stock: 15 },
    { id: 7, nombre: "Cama para Perros", categoria: "perros", subcategoria: "accesorios", precio: 55000, descripcion: "Cama ortopédica para perros grandes", imagen: "https://i.ibb.co/R2qJ2X4/prod-3.jpg", stock: 10 },
    { id: 8, nombre: "Cama para Gatos", categoria: "gatos", subcategoria: "accesorios", precio: 35000, descripcion: "Cama suave y cómoda para gatos", imagen: "https://i.ibb.co/M9F5D21/prod-4.jpg", stock: 12 },
    { id: 9, nombre: "Correa para Perros", categoria: "perros", subcategoria: "accesorios", precio: 15000, descripcion: "Correa resistente y cómoda", imagen: "https://i.ibb.co/S7Jj4r7/prod-1.jpg", stock: 35 },
    { id: 10, nombre: "Shampoo para Perros", categoria: "perros", subcategoria: "salud", precio: 8000, descripcion: "Shampoo hipoalergénico para perros", imagen: "https://i.ibb.co/R2qJ2X4/prod-3.jpg", stock: 50 },
    { id: 11, nombre: "Arena para Gatos", categoria: "gatos", subcategoria: "accesorios", precio: 12000, descripcion: "Arena aglomerante de alta calidad", imagen: "https://i.ibb.co/d7z1y1C/prod-2.jpg", stock: 60 },
    { id: 12, nombre: "Juguete con Plumas", categoria: "gatos", subcategoria: "juguetes", precio: 6000, descripcion: "Juguete interactivo con plumas", imagen: "https://i.ibb.co/M9F5D21/prod-4.jpg", stock: 45 }
];

async function migrateProducts() {
    console.log('Iniciando migración de productos...');

    try {
        // Verificar si ya existen productos
        const productosRef = collection(db, 'productos');
        const snapshot = await getDocs(productosRef);

        if (snapshot.size > 0) {
            console.log(`Ya existen ${snapshot.size} productos en Firestore.`);
            const migrar = confirm('¿Deseas agregar los productos de todas formas?');
            if (!migrar) {
                console.log('Migración cancelada.');
                return;
            }
        }

        // Migrar cada producto
        let count = 0;
        for (const producto of PRODUCTS) {
            // No incluir el id original, Firestore genera uno automático
            const { id, ...productoData } = producto;

            await addDoc(collection(db, 'productos'), {
                ...productoData,
                activo: true,
                fechaCreacion: new Date(),
                oldId: id // Guardar el id original para referencia
            });

            count++;
            console.log(`Producto ${count}/${PRODUCTS.length} migrado: ${producto.nombre}`);
        }

        console.log(`✅ Migración completada: ${count} productos agregados a Firestore`);
        alert(`¡Migración exitosa! ${count} productos agregados a Firestore.`);

    } catch (error) {
        console.error('❌ Error en la migración:', error);
        alert('Error en la migración: ' + error.message);
    }
}

// Función para verificar productos en Firestore
async function verifyProducts() {
    try {
        const productosRef = collection(db, 'productos');
        const snapshot = await getDocs(productosRef);

        console.log(`\n📦 Total de productos en Firestore: ${snapshot.size}`);

        snapshot.forEach((doc) => {
            const data = doc.data();
            console.log(`- ${data.nombre} (${data.categoria}) - Stock: ${data.stock}`);
        });

    } catch (error) {
        console.error('Error al verificar productos:', error);
    }
}

// Exponer funciones globalmente para uso en consola
window.migrateProducts = migrateProducts;
window.verifyProducts = verifyProducts;

console.log('Script de migración cargado.');
console.log('Para migrar productos: migrateProducts()');
console.log('Para verificar productos: verifyProducts()');
