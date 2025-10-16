// Sistema de Favoritos con Firebase
import { auth, db } from './firebase-config.js';
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Agregar/Quitar producto de favoritos
export async function toggleFavorite(productId) {
    const user = auth.currentUser;

    if (!user) {
        alert('Debes iniciar sesión para agregar favoritos');
        window.location.href = 'login.html';
        return false;
    }

    try {
        const favoriteRef = doc(db, 'favoritos', `${user.uid}_${productId}`);
        const isFavorite = await checkIfFavorite(productId);

        if (isFavorite) {
            // Quitar de favoritos
            await deleteDoc(favoriteRef);
            console.log('Producto eliminado de favoritos');
            return false;
        } else {
            // Agregar a favoritos
            const product = await getProductData(productId);
            await setDoc(favoriteRef, {
                userId: user.uid,
                productId: productId,
                nombre: product.nombre,
                precio: product.precio,
                precioOriginal: product.precio, // Para trackear cambios de precio
                imagen: product.imagen,
                categoria: product.categoria,
                fechaAgregado: new Date().toISOString()
            });
            console.log('Producto agregado a favoritos');
            return true;
        }
    } catch (error) {
        console.error('Error al modificar favoritos:', error);
        alert('Error al modificar favoritos');
        return null;
    }
}

// Verificar si un producto está en favoritos
export async function checkIfFavorite(productId) {
    const user = auth.currentUser;
    if (!user) return false;

    try {
        const favoritosRef = collection(db, 'favoritos');
        const q = query(favoritosRef,
            where('userId', '==', user.uid),
            where('productId', '==', productId)
        );
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error('Error al verificar favorito:', error);
        return false;
    }
}

// Obtener todos los favoritos del usuario
export async function getUserFavorites() {
    const user = auth.currentUser;
    if (!user) return [];

    try {
        const favoritosRef = collection(db, 'favoritos');
        const q = query(favoritosRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);

        const favorites = [];
        querySnapshot.forEach((doc) => {
            favorites.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return favorites;
    } catch (error) {
        console.error('Error al obtener favoritos:', error);
        return [];
    }
}

// Obtener datos de un producto desde Firebase
async function getProductData(productId) {
    try {
        const productosRef = collection(db, 'productos');
        const q = query(productosRef, where('id', '==', productId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].data();
        }
        throw new Error('Producto no encontrado');
    } catch (error) {
        console.error('Error al obtener producto:', error);
        throw error;
    }
}

// Actualizar el botón de favorito en la UI
export function updateFavoriteButton(button, isFavorite) {
    if (isFavorite) {
        button.innerHTML = '❤️';
        button.classList.add('favorited');
        button.setAttribute('title', 'Quitar de favoritos');
    } else {
        button.innerHTML = '🤍';
        button.classList.remove('favorited');
        button.setAttribute('title', 'Agregar a favoritos');
    }
}

// Inicializar botones de favoritos en una página
export async function initializeFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('.favorite-btn');

    for (const button of favoriteButtons) {
        const productId = button.dataset.productId;
        if (productId) {
            const isFavorite = await checkIfFavorite(productId);
            updateFavoriteButton(button, isFavorite);

            button.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const newState = await toggleFavorite(productId);
                if (newState !== null) {
                    updateFavoriteButton(button, newState);
                }
            });
        }
    }
}

// Listener para cambios de precio en favoritos
export function watchFavoritePriceChanges(callback) {
    const user = auth.currentUser;
    if (!user) return;

    const favoritosRef = collection(db, 'favoritos');
    const q = query(favoritosRef, where('userId', '==', user.uid));

    return onSnapshot(q, async (snapshot) => {
        for (const change of snapshot.docChanges()) {
            if (change.type === 'modified') {
                const favorite = change.doc.data();
                const currentProduct = await getProductData(favorite.productId);

                // Verificar si el precio bajó
                if (currentProduct.precio < favorite.precioOriginal) {
                    callback({
                        productId: favorite.productId,
                        nombre: favorite.nombre,
                        precioAnterior: favorite.precioOriginal,
                        precioNuevo: currentProduct.precio,
                        descuento: Math.round(((favorite.precioOriginal - currentProduct.precio) / favorite.precioOriginal) * 100)
                    });

                    // Actualizar precio en favoritos
                    await setDoc(doc(db, 'favoritos', change.doc.id), {
                        ...favorite,
                        precio: currentProduct.precio
                    }, { merge: true });
                }
            }
        }
    });
}

// Contar favoritos del usuario
export async function getFavoritesCount() {
    const user = auth.currentUser;
    if (!user) return 0;

    try {
        const favoritosRef = collection(db, 'favoritos');
        const q = query(favoritosRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        return querySnapshot.size;
    } catch (error) {
        console.error('Error al contar favoritos:', error);
        return 0;
    }
}
