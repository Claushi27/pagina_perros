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
    const brands = [
        'Master Dog', 'Champion Dog', 'Pedigree', 'Fit Formula', 'Dog Chow', 'Can',
        'Tyson', 'Dog Buffet', 'Nomade', 'Cannes', 'Cachupin', 'Kongo', 'Gooster',
        'Voller', 'Criadores', 'Power Dog', 'XT', 'Strong', 'Master Cat', 'Champion Cat',
        'Whiskas', 'Cat Chow', 'Gati', 'Masko', 'Bravery', 'Ownat', 'Amity', 'Biofresh',
        'Pro Plan', 'Bokato', 'Agility', 'Yokan', 'Royal Canin', 'Brit', 'Eukanuba',
        'Hills', 'Acana', 'Orijen'
    ];
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

// Crear HTML para panel de filtros LATERAL
export function createFilterPanel(products, category = 'perros') {
    const brands = getAllBrands(products);
    const priceRange = getPriceRange(products);

    return `
        <div class="filters-sidebar" style="background: white; padding: 1.25rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); position: sticky; top: 20px;">
            <!-- Mobile Toggle Button -->
            <button class="filters-toggle-btn" onclick="window.toggleFilters()" aria-label="Mostrar/Ocultar Filtros">
                <span>🔍 Filtros</span>
                <span class="toggle-icon">▼</span>
            </button>

            <!-- Filters Content (collapsible on mobile) -->
            <div class="filters-content">
                <!-- Header con botón limpiar -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; padding-bottom: 0.75rem; border-bottom: 2px solid #8B4513;">
                    <h3 style="margin: 0; font-size: 1.1rem; color: #8B4513; font-weight: 700;">🔍 Filtros</h3>
                    <button onclick="window.clearAllFilters()" style="background: #f5f5f5; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; color: #666; font-weight: 600;">Limpiar</button>
                </div>

            <!-- Filtro de Marcas (compacto con scroll) -->
            <div class="filter-section" style="margin-bottom: 1.5rem;">
                <h4 style="margin-bottom: 0.75rem; color: #8B4513; font-size: 0.95rem; font-weight: 700;">🏷️ Marcas</h4>
                <div style="max-height: 220px; overflow-y: auto; padding-right: 0.5rem;">
                    ${brands.map(brand => `
                        <label style="display: flex; align-items: center; margin-bottom: 0.4rem; cursor: pointer; font-size: 0.85rem;">
                            <input type="checkbox" value="${brand}" ${currentFilters.brands.includes(brand) ? 'checked' : ''}
                                   onchange="window.updateBrandFilter('${brand}')"
                                   style="margin-right: 0.5rem; width: 16px; height: 16px; cursor: pointer; accent-color: #8B4513;">
                            <span style="color: #555;">${brand}</span>
                        </label>
                    `).join('')}
                </div>
            </div>

            <!-- Filtro de Precio (compacto) -->
            <div class="filter-section" style="margin-bottom: 1.5rem;">
                <h4 style="margin-bottom: 0.75rem; color: #8B4513; font-size: 0.95rem; font-weight: 700;">💰 Precio</h4>
                <input type="range" id="priceSlider" min="${priceRange.min}" max="${priceRange.max}"
                       value="${currentFilters.priceMax === 999999 ? priceRange.max : currentFilters.priceMax}"
                       style="width: 100%; cursor: pointer; accent-color: #8B4513;" onchange="window.updatePriceFilter(this.value)">
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #999; margin-top: 0.25rem;">
                    <span>$${priceRange.min.toLocaleString()}</span>
                    <span>$${(currentFilters.priceMax === 999999 ? priceRange.max : currentFilters.priceMax).toLocaleString()}</span>
                </div>
            </div>

            <!-- Ordenar Por -->
            <div class="filter-section">
                <h4 style="margin-bottom: 0.75rem; color: #8B4513; font-size: 0.95rem; font-weight: 700;">📊 Ordenar</h4>
                <select onchange="window.updateSortFilter(this.value)"
                        style="width: 100%; padding: 0.6rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.85rem; cursor: pointer; color: #555;">
                    <option value="default" ${currentFilters.sortBy === 'default' ? 'selected' : ''}>Relevancia</option>
                    <option value="price-asc" ${currentFilters.sortBy === 'price-asc' ? 'selected' : ''}>Precio ↑</option>
                    <option value="price-desc" ${currentFilters.sortBy === 'price-desc' ? 'selected' : ''}>Precio ↓</option>
                </select>
            </div>

                <!-- Contador de resultados -->
                <div style="margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid #e0e0e0; text-align: center;">
                    <span id="filterResultCount" style="color: #666; font-size: 0.85rem; font-weight: 600;"></span>
                </div>
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

// Toggle filters visibility on mobile
window.toggleFilters = function() {
    const filtersContent = document.querySelector('.filters-content');
    const toggleBtn = document.querySelector('.filters-toggle-btn');

    if (filtersContent && toggleBtn) {
        const isOpen = filtersContent.classList.contains('open');

        if (isOpen) {
            filtersContent.classList.remove('open');
            toggleBtn.classList.remove('active');
        } else {
            filtersContent.classList.add('open');
            toggleBtn.classList.add('active');
        }
    }
}
