// Sistema de Filtros Avanzados para Productos

// Estado global de filtros
let currentFilters = {
    priceMin: 0,
    priceMax: 999999,
    brands: [],
    categories: [],
    ages: [],
    sortBy: 'default' // default, price-asc, price-desc, rating, popular
};

// Aplicar todos los filtros a un array de productos
export function applyFilters(products) {
    let filtered = [...products];

    // Filtro de precio
    filtered = filtered.filter(p =>
        p.precio >= currentFilters.priceMin &&
        p.precio <= currentFilters.priceMax
    );

    // Filtro de marcas
    if (currentFilters.brands.length > 0) {
        filtered = filtered.filter(p => {
            const brand = extractBrand(p.nombre);
            return currentFilters.brands.includes(brand);
        });
    }

    // Filtro de categorías/edad
    if (currentFilters.ages.length > 0) {
        filtered = filtered.filter(p => {
            const name = p.nombre.toLowerCase();
            const desc = p.descripcion.toLowerCase();
            return currentFilters.ages.some(age => {
                if (age === 'cachorro' || age === 'puppy') {
                    return name.includes('cachorro') || name.includes('puppy') || desc.includes('cachorro');
                }
                if (age === 'gatito' || age === 'kitten') {
                    return name.includes('gatito') || name.includes('kitten') || desc.includes('gatito');
                }
                if (age === 'adulto') {
                    return !name.includes('cachorro') && !name.includes('senior') && !name.includes('gatito');
                }
                if (age === 'senior') {
                    return name.includes('senior') || desc.includes('senior');
                }
                return false;
            });
        });
    }

    // Ordenamiento
    filtered = sortProducts(filtered, currentFilters.sortBy);

    return filtered;
}

// Ordenar productos
function sortProducts(products, sortBy) {
    const sorted = [...products];

    switch (sortBy) {
        case 'price-asc':
            return sorted.sort((a, b) => a.precio - b.precio);
        case 'price-desc':
            return sorted.sort((a, b) => b.precio - a.precio);
        case 'rating':
            return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        case 'popular':
            return sorted.sort((a, b) => (b.ventas || 0) - (a.ventas || 0));
        case 'name':
            return sorted.sort((a, b) => a.nombre.localeCompare(b.nombre));
        default:
            return sorted;
    }
}

// Extraer marca del nombre del producto
function extractBrand(productName) {
    const brands = ['Royal Canin', 'Pro Plan', 'Pedigree', 'Whiskas', 'Brit', 'Eukanuba', 'Hills', 'Acana', 'Orijen', 'Taste of the Wild', 'Blue Buffalo', 'Wellness', 'Merrick'];
    const nameLower = productName.toLowerCase();

    for (const brand of brands) {
        if (nameLower.includes(brand.toLowerCase())) {
            return brand;
        }
    }
    return 'Otra';
}

// Obtener todas las marcas únicas de un conjunto de productos
export function getAllBrands(products) {
    const brandsSet = new Set();
    products.forEach(p => {
        const brand = extractBrand(p.nombre);
        brandsSet.add(brand);
    });
    return Array.from(brandsSet).sort();
}

// Actualizar filtros
export function updateFilter(filterType, value) {
    switch (filterType) {
        case 'priceMin':
            currentFilters.priceMin = parseInt(value) || 0;
            break;
        case 'priceMax':
            currentFilters.priceMax = parseInt(value) || 999999;
            break;
        case 'brand':
            if (currentFilters.brands.includes(value)) {
                currentFilters.brands = currentFilters.brands.filter(b => b !== value);
            } else {
                currentFilters.brands.push(value);
            }
            break;
        case 'age':
            if (currentFilters.ages.includes(value)) {
                currentFilters.ages = currentFilters.ages.filter(a => a !== value);
            } else {
                currentFilters.ages.push(value);
            }
            break;
        case 'sortBy':
            currentFilters.sortBy = value;
            break;
    }
}

// Limpiar todos los filtros
export function clearFilters() {
    currentFilters = {
        priceMin: 0,
        priceMax: 999999,
        brands: [],
        categories: [],
        ages: [],
        sortBy: 'default'
    };
}

// Obtener filtros actuales
export function getCurrentFilters() {
    return { ...currentFilters };
}

// Crear HTML para panel de filtros
export function createFilterPanel(products, category = 'perros') {
    const brands = getAllBrands(products);
    const priceRange = getPriceRange(products);

    return `
        <div class="filters-panel" style="background: white; padding: 1.5rem; border-radius: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-bottom: 2rem;">
            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0; font-size: 1.3rem; color: #333;">🔍 Filtros</h3>
                <button onclick="window.clearAllFilters()" style="background: #f0f0f0; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-size: 0.9rem;">Limpiar</button>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
                <!-- Filtro de Precio -->
                <div class="filter-section">
                    <h4 style="margin-bottom: 0.75rem; color: #555; font-size: 1rem;">💰 Precio</h4>
                    <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;">
                        <input type="number" id="priceMin" placeholder="Mín" value="${currentFilters.priceMin}"
                               style="width: 100%; padding: 0.5rem; border: 2px solid #e0e0e0; border-radius: 8px;">
                        <span>-</span>
                        <input type="number" id="priceMax" placeholder="Máx" value="${currentFilters.priceMax === 999999 ? '' : currentFilters.priceMax}"
                               style="width: 100%; padding: 0.5rem; border: 2px solid #e0e0e0; border-radius: 8px;">
                    </div>
                    <input type="range" id="priceSlider" min="${priceRange.min}" max="${priceRange.max}"
                           value="${currentFilters.priceMax === 999999 ? priceRange.max : currentFilters.priceMax}"
                           style="width: 100%; cursor: pointer;" onchange="window.updatePriceFilter(this.value)">
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #999;">
                        <span>$${priceRange.min.toLocaleString()}</span>
                        <span>$${priceRange.max.toLocaleString()}</span>
                    </div>
                </div>

                <!-- Filtro de Marcas -->
                <div class="filter-section">
                    <h4 style="margin-bottom: 0.75rem; color: #555; font-size: 1rem;">🏷️ Marcas</h4>
                    <div style="max-height: 150px; overflow-y: auto;">
                        ${brands.map(brand => `
                            <label style="display: flex; align-items: center; margin-bottom: 0.5rem; cursor: pointer;">
                                <input type="checkbox" value="${brand}" ${currentFilters.brands.includes(brand) ? 'checked' : ''}
                                       onchange="window.updateBrandFilter('${brand}')"
                                       style="margin-right: 0.5rem; width: 18px; height: 18px; cursor: pointer;">
                                <span style="font-size: 0.9rem;">${brand}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <!-- Filtro de Edad/Categoría -->
                <div class="filter-section">
                    <h4 style="margin-bottom: 0.75rem; color: #555; font-size: 1rem;">🎂 Edad</h4>
                    ${category === 'perros' ? `
                        <label style="display: flex; align-items: center; margin-bottom: 0.5rem; cursor: pointer;">
                            <input type="checkbox" value="cachorro" ${currentFilters.ages.includes('cachorro') ? 'checked' : ''}
                                   onchange="window.updateAgeFilter('cachorro')"
                                   style="margin-right: 0.5rem; width: 18px; height: 18px; cursor: pointer;">
                            <span style="font-size: 0.9rem;">Cachorro</span>
                        </label>
                    ` : `
                        <label style="display: flex; align-items: center; margin-bottom: 0.5rem; cursor: pointer;">
                            <input type="checkbox" value="gatito" ${currentFilters.ages.includes('gatito') ? 'checked' : ''}
                                   onchange="window.updateAgeFilter('gatito')"
                                   style="margin-right: 0.5rem; width: 18px; height: 18px; cursor: pointer;">
                            <span style="font-size: 0.9rem;">Gatito</span>
                        </label>
                    `}
                    <label style="display: flex; align-items: center; margin-bottom: 0.5rem; cursor: pointer;">
                        <input type="checkbox" value="adulto" ${currentFilters.ages.includes('adulto') ? 'checked' : ''}
                               onchange="window.updateAgeFilter('adulto')"
                               style="margin-right: 0.5rem; width: 18px; height: 18px; cursor: pointer;">
                        <span style="font-size: 0.9rem;">Adulto</span>
                    </label>
                    <label style="display: flex; align-items: center; margin-bottom: 0.5rem; cursor: pointer;">
                        <input type="checkbox" value="senior" ${currentFilters.ages.includes('senior') ? 'checked' : ''}
                               onchange="window.updateAgeFilter('senior')"
                               style="margin-right: 0.5rem; width: 18px; height: 18px; cursor: pointer;">
                        <span style="font-size: 0.9rem;">Senior</span>
                    </label>
                </div>

                <!-- Ordenar Por -->
                <div class="filter-section">
                    <h4 style="margin-bottom: 0.75rem; color: #555; font-size: 1rem;">📊 Ordenar por</h4>
                    <select onchange="window.updateSortFilter(this.value)"
                            style="width: 100%; padding: 0.5rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.9rem; cursor: pointer;">
                        <option value="default" ${currentFilters.sortBy === 'default' ? 'selected' : ''}>Relevancia</option>
                        <option value="price-asc" ${currentFilters.sortBy === 'price-asc' ? 'selected' : ''}>Precio: Menor a Mayor</option>
                        <option value="price-desc" ${currentFilters.sortBy === 'price-desc' ? 'selected' : ''}>Precio: Mayor a Menor</option>
                        <option value="name" ${currentFilters.sortBy === 'name' ? 'selected' : ''}>Nombre A-Z</option>
                        <option value="rating" ${currentFilters.sortBy === 'rating' ? 'selected' : ''}>Mejor Calificados</option>
                        <option value="popular" ${currentFilters.sortBy === 'popular' ? 'selected' : ''}>Más Populares</option>
                    </select>
                </div>
            </div>

            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e0e0e0; text-align: center;">
                <span id="filterResultCount" style="color: #666; font-size: 0.9rem;"></span>
            </div>
        </div>
    `;
}

// Obtener rango de precios de productos
function getPriceRange(products) {
    if (products.length === 0) return { min: 0, max: 100000 };

    const prices = products.map(p => p.precio);
    return {
        min: Math.floor(Math.min(...prices) / 1000) * 1000,
        max: Math.ceil(Math.max(...prices) / 1000) * 1000
    };
}
