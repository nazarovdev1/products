// API Base URL
const API_URL = '/api/products';

// State
let allProducts = [];
let filteredProducts = [];
let isEditing = false;
let editingProductCode = null;
let deletingProductCode = null;
let deletingProductId = null;

// DOM Elements
const searchInput = document.getElementById('searchInput');
// const categoryFilter = document.getElementById('categoryFilter'); // Removed
const productsContainer = document.getElementById('productsContainer');
const noResults = document.getElementById('noResults');
const addProductBtn = document.getElementById('addProductBtn');
const soldProductBtn = document.getElementById('soldProductBtn');
const addProductModal = document.getElementById('addProductModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const addProductForm = document.getElementById('addProductForm');
const soldProductModal = document.getElementById('soldProductModal');
const closeSoldModalBtn = document.getElementById('closeSoldModalBtn');
const cancelSoldBtn = document.getElementById('cancelSoldBtn');
const soldProductForm = document.getElementById('soldProductForm');
const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const closeDeleteConfirmModalBtn = document.getElementById('closeDeleteConfirmModalBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const deleteConfirmText = document.getElementById('deleteConfirmText');
const detailsModal = document.getElementById('detailsModal');
const closeDetailsModalBtn = document.getElementById('closeDetailsModalBtn');
const closeDetailsBtn = document.getElementById('closeDetailsBtn');
const productDetails = document.getElementById('productDetails');
const editFromDetailsBtn = document.getElementById('editFromDetailsBtn');
const deleteFromDetailsBtn = document.getElementById('deleteFromDetailsBtn');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const successText = document.getElementById('successText');
const errorText = document.getElementById('errorText');

// Statistics Elements
const totalProducts = document.getElementById('totalProducts');
const newProducts = document.getElementById('newProducts');
const ostatkProducts = document.getElementById('ostatkProducts');
const totalStock = document.getElementById('totalStock');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    searchInput.addEventListener('input', handleSearchAndFilter);
    // categoryFilter.addEventListener('change', handleSearchAndFilter); // Removed
    addProductBtn.addEventListener('click', openModal);
    soldProductBtn.addEventListener('click', openSoldModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    addProductForm.addEventListener('submit', handleAddProduct);
    closeSoldModalBtn.addEventListener('click', closeSoldModal);
    cancelSoldBtn.addEventListener('click', closeSoldModal);
    soldProductForm.addEventListener('submit', handleSellProduct);
    closeDeleteConfirmModalBtn.addEventListener('click', closeDeleteConfirmModal);
    cancelDeleteBtn.addEventListener('click', closeDeleteConfirmModal);
    confirmDeleteBtn.addEventListener('click', confirmDelete);
    closeDetailsModalBtn.addEventListener('click', closeDetailsModal);
    closeDetailsBtn.addEventListener('click', closeDetailsModal);

    // Note: editFromDetailsBtn and deleteFromDetailsBtn event listeners are added dynamically in handleShowDetails

    // Close modal on outside click
    addProductModal.addEventListener('click', (e) => {
        if (e.target === addProductModal) {
            closeModal();
        }
    });
}

// Load Products
async function loadProducts() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch products');

        allProducts = await response.json();
        filteredProducts = [...allProducts];
        renderProducts(filteredProducts);
        updateStatistics();
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Mahsulotlarni yuklashda xatolik yuz berdi');
    }
}

// Render Products
function renderProducts(products) {
    if (products.length === 0) {
        productsContainer.innerHTML = '';
        noResults.classList.remove('hidden');
        return;
    }

    noResults.classList.add('hidden');

    productsContainer.innerHTML = products.map(product => {
        return `
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition cursor-pointer product-card" data-code="${product.code}">
            <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                    <h3 class="text-lg font-semibold text-gray-800">${product.title}</h3>
                    <span class="text-sm text-gray-500 font-mono">Kod: ${product.code || '-'}</span>
                </div>
                ${product.image ? `<img src="${product.image}" alt="${product.title}" class="w-16 h-16 object-cover rounded">` : '<div class="w-16 h-16 bg-gray-200 rounded flex items-center justify-center"><i class="fas fa-image text-gray-400 text-xl"></i></div>'}
            </div>
            <div class="flex items-center justify-between text-sm text-gray-600">
                ${product.image ? `<img src="${product.image}" alt="${product.title}" class="w-16 h-16 object-cover rounded">` : '<div class="w-16 h-16 bg-gray-200 rounded flex items-center justify-center"><i class="fas fa-image text-gray-400 text-xl"></i></div>'}
            </div>
            <div class="flex items-center justify-between text-sm text-gray-600">
                <span class="flex items-center">
                    <i class="fas fa-palette mr-1 text-purple-500"></i>
                    ${product.color}
                </span>
                <span class="flex items-center">
                    <i class="fas fa-box mr-1 text-green-500"></i>
                    ${product.stock} dona
                </span>
            </div>
            <div class="mt-2 flex items-center justify-between">
                <span class="text-sm font-medium text-green-600">${formatPrice(product.price)}</span>
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${product.status === 'yangi' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}">
                    ${product.status === 'yangi' ? 'Yangi' : 'Ostatka'}
                </span>
            </div>
        </div>
    `}).join('');

    // Add click event to product cards
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const productCode = e.currentTarget.dataset.code;
            handleShowDetails(productCode);
        });
    });
}

// Handle Search and Filter
function handleSearchAndFilter() {
    const query = searchInput.value.toLowerCase().trim();
    // const selectedCategory = categoryFilter.value; // Removed

    filteredProducts = allProducts.filter(product => {
        // Category filter removed
        /*
        if (selectedCategory && product.category !== selectedCategory) {
            return false;
        }
        */

        // Search filter
        if (query) {
            return (
                product.title.toLowerCase().includes(query) ||
                // product.category.toLowerCase().includes(query) || // Removed
                product.color.toLowerCase().includes(query) ||
                product.code?.toLowerCase().includes(query) ||
                product.status.toLowerCase().includes(query) ||
                product.size?.toString().toLowerCase().includes(query)
            );
        }

        return true;
    });

    renderProducts(filteredProducts);
}

// Handle Add Product
async function handleAddProduct(e) {
    e.preventDefault();

    const formData = new FormData(addProductForm);

    try {
        let response;
        if (isEditing) {
            // For edit, prepare JSON data
            const title = addProductForm.elements['title'].value;
            const code = addProductForm.elements['code'].value;
            // const category = addProductForm.elements['category'].value; // Removed
            const status = addProductForm.elements['status'].value;
            const color = addProductForm.elements['color'].value;
            const price = addProductForm.elements['price'].value;
            // const purchase_price = addProductForm.elements['purchase_price'].value; // Removed
            const stock = addProductForm.elements['stock'].value;
            const size = addProductForm.elements['size'].value;
            const sold_price = addProductForm.elements['sold_price'].value || 0;
            const sold_date = addProductForm.elements['sold_date'].value || '';

            const sizeArray = size ? size.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];

            const productData = {
                title: title,
                category: "", // Default empty or removed
                price: parseInt(price),
                code: code,  // Note: we don't want to change the code during editing, so this will be ignored by the server
                status: status,
                color: color,
                stock: parseInt(stock),
                size: sizeArray,
                purchase_price: 0, // Default to 0 as field is removed
                sold_price: parseInt(sold_price),
                sold_date: sold_date
                // image is handled by the server to preserve existing image if no new image is provided
            };

            console.log("Sending PATCH request with data:", productData); // Debug log
            console.log("Editing product with code:", editingProductCode); // Debug log

            response = await fetch(`${API_URL}/${editingProductCode}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update product');
            }

            showSuccess('Mahsulot muvaffaqiyatli yangilandi!');
        } else {
            // New product with file upload - send FormData as multipart
            response = await fetch(API_URL, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to add product');
            }

            showSuccess('Mahsulot muvaffaqiyatli qo\'shildi!');
        }

        closeModal();
        addProductForm.reset();
        await loadProducts();
    } catch (error) {
        console.error('Error saving product:', error);
        showError(error.message || 'Mahsulot saqlashda xatolik yuz berdi');
    }
}

// Handle Delete Product
function handleDelete(productCode) {
    // Close details modal if it's open
    closeDetailsModal();

    // Find product for confirmation text
    const product = allProducts.find(p => p.code === productCode);
    const productName = product ? product.title : 'Mahsulot';

    // Set the confirmation text
    const displayCode = productCode || (product ? product.id : 'Noma\'lum');
    deleteConfirmText.innerHTML = `Siz rostdan ham "${productName}" (kod: ${displayCode}) mahsulotini o'chirishni istaysizmi?<br><br>Bu amalni ortga qaytarib bo'lmaydi.`;
    deletingProductCode = productCode;
    deletingProductId = product ? product.id : null;

    // Show modal
    deleteConfirmModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Confirm Delete
async function confirmDelete() {
    if (!deletingProductCode && !deletingProductId) {
        console.error('No product code or ID set for deletion');
        showError('Mahsulot o\'chirishda xatolik yuz berdi');
        closeDeleteConfirmModal();
        return;
    }

    console.log("Attempting to delete product with code:", deletingProductCode); // Debug log

    try {
        // Use code if available, otherwise fall back to ID
        let deleteUrl;
        if (deletingProductCode) {
            deleteUrl = `${API_URL}/${deletingProductCode}`;
        } else {
            // Find product by ID as fallback
            const product = allProducts.find(p => p.id === deletingProductId);
            if (product) {
                deleteUrl = `${API_URL}/id/${product.id}`;
            } else {
                throw new Error('Mahsulot topilmadi');
            }
        }

        const response = await fetch(deleteUrl, {
            method: 'DELETE'
        });

        console.log("Delete response status:", response.status); // Debug log

        if (!response.ok) {
            const error = await response.json();
            console.error('Delete request failed:', error); // Debug log
            throw new Error(error.error || 'Failed to delete product');
        }

        showSuccess('Mahsulot muvaffaqiyatli o\'chirildi!');
        closeDeleteConfirmModal();
        await loadProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        showError(error.message || 'Mahsulot o\'chirishda xatolik yuz berdi');
        closeDeleteConfirmModal(); // Ensure modal is closed even on error
    }
}

// Close Delete Confirm Modal
function closeDeleteConfirmModal() {
    deleteConfirmModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    deletingProductCode = null;
    deletingProductId = null;
}

// Handle Edit Product
async function handleEdit(productCode) {
    const product = allProducts.find(p => p.code === productCode);
    if (!product) {
        showError('Mahsulot topilmadi');
        return;
    }

    isEditing = true;
    editingProductCode = productCode;

    // Fill form with product data
    addProductForm.elements['title'].value = product.title || '';
    addProductForm.elements['code'].value = product.code || '';
    // addProductForm.elements['category'].value = product.category || ''; // Removed
    addProductForm.elements['color'].value = product.color || '';
    addProductForm.elements['size'].value = Array.isArray(product.size) ? product.size.join(', ') : product.size || '';
    addProductForm.elements['price'].value = product.price || '';
    // addProductForm.elements['purchase_price'].value = product.purchase_price || ''; // Removed
    addProductForm.elements['stock'].value = product.stock || '';
    addProductForm.elements['status'].value = product.status || 'yangi';
    addProductForm.elements['sold_price'].value = product.sold_price || '';
    addProductForm.elements['sold_date'].value = product.sold_date || '';

    // Change modal title
    const modalTitle = addProductModal.querySelector('h2');
    modalTitle.innerHTML = '<i class="fas fa-edit mr-2"></i>Mahsulotni Tahrirlash';

    // Close details modal if it's open
    closeDetailsModal();

    openModal();
}

// Handle Show Product Details
function handleShowDetails(productCode) {
    const product = allProducts.find(p => p.code === productCode);
    if (!product) {
        showError('Mahsulot topilmadi');
        return;
    }

    let sizeDisplay = product.size;
    if (Array.isArray(product.size)) {
        sizeDisplay = product.size.join(', ');
    }

    productDetails.innerHTML = `
        ${product.image ? `<div class="flex justify-center mb-6"><img src="${product.image}" alt="${product.title}" class="max-w-xs max-h-64 object-cover rounded-lg"></div>` : ''}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
                <div class="flex items-center space-x-3">
                    <i class="fas fa-hashtag text-blue-600 w-5"></i>
                    <div>
                        <p class="text-sm text-gray-500">Mahsulot Kodi</p>
                        <p class="font-semibold">${product.code || '-'}</p>
                    </div>
                </div>

                <div class="flex items-center space-x-3">
                    <i class="fas fa-tag text-green-600 w-5"></i>
                    <div>
                        <p class="text-sm text-gray-500">Nomi</p>
                        <p class="font-semibold">${product.title}</p>
                    </div>
                </div>

                    </div>
                </div>

                <!-- Category removed from details -->
                <!--
                <div class="flex items-center space-x-3">
                    <i class="fas fa-folder text-purple-600 w-5"></i>
                    <div>
                        <p class="text-sm text-gray-500">Kategoriya</p>
                        <p class="font-semibold">${product.category}</p>
                    </div>
                </div>
                -->

                <div class="flex items-center space-x-3">

                <div class="flex items-center space-x-3">
                    <i class="fas fa-palette text-indigo-600 w-5"></i>
                    <div>
                        <p class="text-sm text-gray-500">Rang</p>
                        <p class="font-semibold">${product.color}</p>
                    </div>
                </div>

                <div class="flex items-center space-x-3">
                    <i class="fas fa-tshirt text-orange-600 w-5"></i>
                    <div>
                        <p class="text-sm text-gray-500">Razmerlar</p>
                        <p class="font-semibold">${sizeDisplay}</p>
                    </div>
                </div>
            </div>

            <div class="space-y-4">
                <div class="flex items-center space-x-3">
                    <i class="fas fa-box text-teal-600 w-5"></i>
                    <div>
                        <p class="text-sm text-gray-500">Omborda</p>
                        <p class="font-semibold">${product.stock} dona</p>
                    </div>
                </div>

                <div class="flex items-center space-x-3">
                    <i class="fas fa-dollar-sign text-green-600 w-5"></i>
                    <div>
                        <p class="text-sm text-gray-500">Narx</p>
                        <p class="font-semibold">${formatPrice(product.price)}</p>
                    </div>
                </div>

                <div class="flex items-center space-x-3">
                    <i class="fas fa-money-bill-wave text-blue-600 w-5"></i>
                    <div>
                        <p class="text-sm text-gray-500">Kirim Narx</p>
                        <p class="font-semibold">${formatPrice(product.purchase_price)}</p>
                    </div>
                </div>

                <div class="flex items-center space-x-3">
                    <i class="fas fa-shopping-cart text-red-600 w-5"></i>
                    <div>
                        <p class="text-sm text-gray-500">Sotilgan Narx</p>
                        <p class="font-semibold ${product.sold_price > 0 ? 'text-green-600' : 'text-gray-400'}">${product.sold_price > 0 ? formatPrice(product.sold_price) : '-'}</p>
                    </div>
                </div>

                <div class="flex items-center space-x-3">
                    <i class="fas fa-calendar-alt text-gray-600 w-5"></i>
                    <div>
                        <p class="text-sm text-gray-500">Sotilgan Sana</p>
                        <p class="font-semibold">${product.sold_date || '-'}</p>
                    </div>
                </div>

                <div class="flex items-center space-x-3">
                    <i class="fas fa-clock text-gray-600 w-5"></i>
                    <div>
                        <p class="text-sm text-gray-500">Qo'shildi</p>
                        <p class="font-semibold">${product.creation_date || '-'}</p>
                    </div>
                </div>

                <div class="flex items-center space-x-3">
                    <i class="fas fa-info-circle text-yellow-600 w-5"></i>
                    <div>
                        <p class="text-sm text-gray-500">Status</p>
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${product.status === 'yangi' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}">
                            ${product.status === 'yangi' ? 'Yangi' : 'Ostatka'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Set data attributes for modal buttons
    editFromDetailsBtn.dataset.code = productCode;
    deleteFromDetailsBtn.dataset.code = productCode;

    // Remove previous event listeners to avoid duplicates
    const editBtn = document.getElementById('editFromDetailsBtn');
    const deleteBtn = document.getElementById('deleteFromDetailsBtn');

    // Store the event handlers to remove them first
    if (editBtn._handleEdit) {
        editBtn.removeEventListener('click', editBtn._handleEdit);
    }
    if (deleteBtn._handleDelete) {
        deleteBtn.removeEventListener('click', deleteBtn._handleDelete);
    }

    // Create new handlers and store them
    editBtn._handleEdit = () => handleEdit(productCode);
    deleteBtn._handleDelete = () => handleDelete(productCode);

    // Add new event listeners
    editBtn.addEventListener('click', editBtn._handleEdit);
    deleteBtn.addEventListener('click', deleteBtn._handleDelete);

    // Show modal
    detailsModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Close Details Modal
function closeDetailsModal() {
    detailsModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Update Statistics
function updateStatistics() {
    totalProducts.textContent = allProducts.length;
    newProducts.textContent = allProducts.filter(p => p.status === 'yangi').length;
    ostatkProducts.textContent = allProducts.filter(p => p.status === 'ostatka').length;
    totalStock.textContent = allProducts.reduce((sum, p) => sum + p.stock, 0);
}

// Modal Functions
function openModal() {
    addProductModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    addProductModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    addProductForm.reset();

    // Reset edit state
    isEditing = false;
    editingProductCode = null;

    // Reset modal title
    const modalTitle = addProductModal.querySelector('h2');
    modalTitle.innerHTML = '<i class="fas fa-plus-circle mr-2"></i>Yangi Mahsulot Qo\'shish';
}

// Message Functions
function showSuccess(message) {
    successText.textContent = message;
    successMessage.classList.remove('hidden');
    setTimeout(() => {
        successMessage.classList.add('hidden');
    }, 3000);
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 3000);
}

// Sold Modal Functions
function openSoldModal() {
    // Fill product select
    const productSelect = soldProductForm.elements['selectedProduct'];
    productSelect.innerHTML = '<option value="">Mahsulotni tanlang...</option>';

    allProducts.forEach(product => {
        const option = document.createElement('option');
        option.value = product.code;
        option.textContent = `${product.title} (${product.code}) - ${product.stock} dona`;
        productSelect.appendChild(option);
    });

    soldProductModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeSoldModal() {
    soldProductModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    soldProductForm.reset();
}

// Handle Sell Product
async function handleSellProduct(e) {
    e.preventDefault();

    const formData = new FormData(soldProductForm);
    const selectedProductCode = formData.get('selectedProduct');
    const quantitySold = parseInt(formData.get('quantitySold'));
    const sellPrice = parseInt(formData.get('sellPrice'));
    const sellDate = formData.get('sellDate') || new Date().toISOString().split('T')[0];

    if (!selectedProductCode || quantitySold <= 0) {
        showError('Mahsulot va miqdorni to\'g\'ri tanlang');
        return;
    }

    const product = allProducts.find(p => p.code === selectedProductCode);
    if (!product) {
        showError('Mahsulot topilmadi');
        return;
    }

    if (product.stock < quantitySold) {
        showError('Ombor ichida buncha mahsulot yo\'q');
        return;
    }

    const updatedProduct = {
        ...product,
        stock: product.stock - quantitySold,
        sold_price: sellPrice,
        sold_date: sellDate
    };

    try {
        const response = await fetch(`${API_URL}/${selectedProductCode}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedProduct)
        });

        if (!response.ok) {
            throw new Error('Mahsulot yangilanishda xatolik');
        }

        if (!response.ok) {
            throw new Error('Mahsulot yangilanishda xatolik');
        }

        // Check if remaining stock is 0, if so delete the product
        const remainingStock = product.stock - quantitySold;
        if (remainingStock <= 0) {
            const deleteResponse = await fetch(`${API_URL}/${selectedProductCode}`, {
                method: 'DELETE'
            });

            if (deleteResponse.ok) {
                showSuccess(`${quantitySold} dona sotildi va mahsulot tugagani uchun o'chirildi!`);
            } else {
                showSuccess(`${quantitySold} dona mahsulot sotildi! (Lekin o'chirishda xatolik)`);
            }
        } else {
            showSuccess(`${quantitySold} dona mahsulot sotildi!`);
        }

        closeSoldModal();
        await loadProducts();
    } catch (error) {
        console.error('Error selling product:', error);
        showError('Mahsulot sotishda xatolik yuz berdi');
    }
}

// Format Price
function formatPrice(price) {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
}
