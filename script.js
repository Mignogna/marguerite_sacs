const container = document.getElementById('cards-products');
let allProducts = [];
let favorites = JSON.parse(localStorage.getItem('favorites') || '{}');


function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

(function () {
    const originalAlert = window.alert.bind(window);
    console.log('alert override installed');
    window.alert = function (message) {
        try {
            let modal = document.getElementById('checkout-modal');
            let body = modal && document.getElementById('checkout-modal-body');
            if (!modal || !body) {
                modal = document.createElement('div');
                modal.id = 'checkout-modal';
                modal.className = 'cart-modal';
                modal.innerHTML = `
                    <div class="cart-modal-content">
                        <button class="close-cart" id="close-checkout">×</button>
                        <h3><img src="./Assets/Image/daisyIcon.png" alt="Daisy Icon"> Mensagem</h3>
                        <div id="checkout-modal-body"></div>
                    </div>`;
                document.body.appendChild(modal);
                const closeBtn = modal.querySelector('#close-checkout');
                if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('show'));
                body = document.getElementById('checkout-modal-body');
            }
            body.innerHTML = `<div style="white-space:pre-wrap;">${String(message)}</div><div style="text-align:right; margin-top:1rem;"><button id="alert-close" class="confirm">Fechar</button></div>`;
            console.log('alert intercepted:', message);
            modal.classList.add('show');
            const close = document.getElementById('alert-close');
            if (close) close.addEventListener('click', () => modal.classList.remove('show'));
        } catch (e) {
            originalAlert(message);
        }
    };
})();

let cartItems = JSON.parse(localStorage.getItem('cartItems') || '{}');
let buyBound = false;

function saveCart() {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
}

function getCartCount() {
    return Object.values(cartItems).reduce((s, q) => s + Number(q || 0), 0);
}

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    badge.textContent = getCartCount();
}



function displayCards(products) {
    container.innerHTML = '';

    products.forEach(item => {
        const formattedPrice = item.price.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        const originalIndex = allProducts.indexOf(item);
        const isFav = !!favorites[originalIndex];
        const div = document.createElement('div');
        div.className = 'card-product';
        div.innerHTML = `
            <button class="fav-btn ${isFav ? 'active' : ''}" data-index="${originalIndex}" aria-label="Favoritar">${isFav ? '♥' : '♡'}</button>
            <img class="img-product" src="${item.image}" alt="${item.name}">
            <h4 lang="fr" translate="no">${item.name}</h4>
            <p>${formattedPrice}</p>
            <button class="btn-buy" data-index="${originalIndex}">Comprar</button>
        `;
        container.appendChild(div);
    });
}

function renderCards() {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            allProducts = data;
            displayCards(allProducts);
            initMagnifiers();
            bindBuyButtons();
            updateCartBadge();
        })
        .catch(error => console.error(error));
}

function initMagnifiers() {
    const imgs = document.querySelectorAll('.img-product');
    const ZOOM = 2;

    imgs.forEach(img => {
        let mag = null;

        function createMagnifier() {
            mag = document.createElement('div');
            mag.className = 'magnifier';
            mag.style.backgroundImage = `url(${img.src})`;
            document.body.appendChild(mag);
            const rect = img.getBoundingClientRect();
            mag.style.backgroundSize = (rect.width * ZOOM) + 'px ' + (rect.height * ZOOM) + 'px';
        }

        function removeMagnifier() {
            if (mag && mag.parentNode) mag.parentNode.removeChild(mag);
            mag = null;
        }

        img.addEventListener('mouseenter', (e) => {
            if (!mag) createMagnifier();
        });

        img.addEventListener('mousemove', (e) => {
            if (!mag) createMagnifier();
            const rect = img.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const px = (x / rect.width) * 100;
            const py = (y / rect.height) * 100;

            mag.style.left = (e.pageX + 40) + 'px';
            mag.style.top = (e.pageY - 40) + 'px';

            mag.style.backgroundPosition = `${px}% ${py}%`;
            mag.style.backgroundSize = (rect.width * ZOOM) + 'px ' + (rect.height * ZOOM) + 'px';
        });

        img.addEventListener('mouseleave', () => {
            removeMagnifier();
        });

        window.addEventListener('resize', () => {
            if (mag) removeMagnifier();
        });
    });
}
function filterByCategory(category) {
    if (category === 'all') {
        displayCards(allProducts);
        initMagnifiers();
    } else {
        const filtered = allProducts.filter(
            item => item.category === category
        );
        displayCards(filtered);
        initMagnifiers();
    }
}

function bindBuyButtons() {
    if (!container || buyBound) return;
    container.addEventListener('click', function (e) {
        const fav = e.target.closest('.fav-btn');
        if (fav) {
            const idx = fav.dataset.index;
            if (typeof idx !== 'undefined' && idx !== null) {
                if (favorites[idx]) delete favorites[idx];
                else favorites[idx] = true;
                saveFavorites();
                fav.classList.toggle('active');
                fav.textContent = favorites[idx] ? '♥' : '♡';
            }
            return;
        }
        const btn = e.target.closest('.btn-buy');
        if (!btn) return;
        const idx = btn.dataset.index;
        if (typeof idx === 'undefined' || idx === null) return;
        cartItems[idx] = (Number(cartItems[idx] || 0) + 1);
        saveCart();
        updateCartBadge();
        const badge = document.getElementById('cart-badge');
        if (badge) {
            badge.classList.add('pulse');
            setTimeout(() => badge.classList.remove('pulse'), 350);
        }
    });
    buyBound = true;
}

const productsSection = document.getElementById('products');
const btnSacola = document.getElementById('btn-bag');

if (productsSection && btnSacola) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                btnSacola.classList.remove('hidden'); 
            } else {
                btnSacola.classList.add('hidden');  
            }
        });
    }, { 
        threshold: 0, 
        rootMargin: "0px 0px -50px 0px",
    });

    observer.observe(productsSection);
}

function openCartModal() {
    const modal = document.getElementById('cart-modal');
    if (!modal) return;
    modal.classList.add('show');
    renderCartModal();
}

function closeCartModal() {
    const modal = document.getElementById('cart-modal');
    if (!modal) return;
    modal.classList.remove('show');
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (!modal) return;
    modal.classList.remove('show');
}

function formatCurrency(value) {
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function renderCartModal() {
    const body = document.getElementById('cart-modal-body');
    if (!body) return;
    const keys = Object.keys(cartItems).filter(k => Number(cartItems[k]) > 0);
    if (!keys.length) {
        body.innerHTML = '<p>Sua sacola está vazia.</p>';
        return;
    }
    let total = 0;
    let rows = keys.map(k => {
        const idx = Number(k);
        const qty = Number(cartItems[k]);
        const product = allProducts[idx];
        if (!product) return '';
        const subtotal = product.price * qty;
        total += subtotal;
        return `<tr data-index="${idx}">
            <td lang="fr" translate="no">${product.name}</td>
            <td style="width:125px; text-align:center;">
                <button class="qty-btn"  data-action="decrease" data-index="${idx}">−</button>
                <span class="qty" data-index="${idx}" style="display:inline-block; min-width:18px;">${qty}</span>
                <button class="qty-btn" data-action="increase" data-index="${idx}">+</button>
            </td>
            <td style="width:120px;">${formatCurrency(product.price)}</td>
            <td style="width:120px; text-align:center">${formatCurrency(subtotal)}</td>
            <td style="width:110px; text-align:right;"><button class="cart-action" data-action="remove" data-index="${idx}">Remover</button></td>
        </tr>`;
    }).join('');

    const shipping = +(total * 0.08);
    const grandTotal = +(total + shipping);

    body.innerHTML = `
        <table class="cart-table">
            <thead><tr><th>Produto</th><th>Qtd</th><th>Preço</th><th>Subtotal</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
        </table>
        <div class="cart-totals" style="margin-top:1rem; text-align:right;">
            <div class="cart-subtotal">Subtotal: ${formatCurrency(total)}</div>
            <div class="cart-shipping">Frete de 8%: ${formatCurrency(shipping)}</div>
            <div class="cart-grandtotal" style="font-weight:700; margin-top:0.5rem;">Total com frete: ${formatCurrency(grandTotal)}</div>
        </div>
        <div class="cart-actions">
            <button class="clear" id="clear-cart">Limpar</button>
            <button class="checkout" id="checkout">Finalizar Pedido</button>
        </div>
    `;

    body.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const idx = this.dataset.index;
            const action = this.dataset.action;
            if (!idx) return;
            if (action === 'increase') {
                cartItems[idx] = (Number(cartItems[idx] || 0) + 1);
            } else if (action === 'decrease') {
                cartItems[idx] = (Number(cartItems[idx] || 0) - 1);
                if (cartItems[idx] <= 0) delete cartItems[idx];
            }
            saveCart();
            updateCartBadge();
            renderCartModal();
        });
    });

    body.querySelectorAll('.cart-action').forEach(btn => {
        btn.addEventListener('click', function () {
            const idx = this.dataset.index;
            if (!idx) return;
            delete cartItems[idx];
            saveCart();
            updateCartBadge();
            renderCartModal();
        });
    });

    const clearBtn = document.getElementById('clear-cart');
    if (clearBtn) clearBtn.addEventListener('click', function () {
        cartItems = {};
        saveCart();
        updateCartBadge();
        renderCartModal();
    });

    const checkoutBtn = document.getElementById('checkout');
    if (checkoutBtn) checkoutBtn.addEventListener('click', function () {
        const total = keys.reduce((s, k) => {
            const p = allProducts[Number(k)];
            return s + (p ? p.price * cartItems[k] : 0);
        }, 0);
        const shipping = +(total * 0.08);
        const grandTotal = +(total + shipping);
        openCheckoutModal(grandTotal);
    });
}

document.addEventListener('click', function (e) {
    const bag = e.target.closest('.btn-bag, .cart-link');
    if (!bag) return;
    e.preventDefault();
    openCartModal();
});

document.addEventListener('click', function (e) {
    if (e.target.id === 'close-cart') {
        closeCartModal();
        return;
    }
    if (e.target.id === 'close-checkout') {
        closeCheckoutModal();
        return;
    }

    if (e.target.classList && e.target.classList.contains('cart-modal')) {
        if (e.target.id === 'cart-modal') closeCartModal();
        else if (e.target.id === 'checkout-modal') closeCheckoutModal();
        else { closeCartModal(); closeCheckoutModal(); }
    }
});

function openCheckoutModal(total) {
    const modal = document.getElementById('checkout-modal');
    const body = document.getElementById('checkout-modal-body');
    if (!modal || !body) return;
    body.innerHTML = `
        <form id="checkout-form" class="checkout-form">
        <div class="form-row total-payment"><label>Total da Compra:</label><div> ${formatCurrency(total)}</div></div>
            <h4>Pagamento (somente Cartão de Crédito)</h4>
            <div class="form-row"><label>Titular do Cartão</label><input name="cardName" id="cardName" required></div>
            <div class="form-row"><label>Nº do Cartão</label><input name="cardNumber" id="cardNumber" inputmode="numeric" autocomplete="cc-number" required></div>
            <div class="form-row"><label>Validade (MM/AA)</label><input name="cardExpiry" id="cardExpiry" placeholder="MM/AA" required></div>
            <div class="form-row"><label>CVV</label><input name="cardCvv" id="cardCvv" inputmode="numeric" required></div>

            <h4>Endereço de Entrega</h4>
            <div class="form-row"><label>Nome</label><input name="name" required></div>
            <div class="form-row"><label>Endereço</label><input name="address" required></div>
            <div class="form-row"><label>Cidade</label><input name="city" required></div>
            <div class="form-row"><label>País</label><input name="country" required></div>


            <div class="form-row"><label>CEP</label><input name="postal" required></div>
            <div class="form-row"><label>WhatsApp</label><input name="phone"></div>

            <div class="checkout-submit-row">
                <button type="button" class="cancel" id="cancel-checkout">Cancelar</button>
                <button type="submit" class="confirm">Confirmar Pedido</button>
            </div>
        </form>
    `;
    modal.classList.add('show');

    const form = document.getElementById('checkout-form');
    if (form) {
        form.addEventListener('submit', function (ev) {
            ev.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            const cardNumber = (data.cardNumber || '').replace(/\s+/g, '');
            const cardExpiry = (data.cardExpiry || '').trim();
            const cardCvv = (data.cardCvv || '').trim();

            const errEl = document.getElementById('checkout-error');
            if (errEl) errEl.textContent = '';
            if (!/^[0-9]{13,19}$/.test(cardNumber)) {
                if (errEl) errEl.textContent = 'Número do cartão inválido. Use apenas dígitos (13-19).';
                return;
            }
            if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
                if (errEl) errEl.textContent = 'Validade inválida. Use o formato MM/AA.';
                return;
            }
            if (!/^\d{3,4}$/.test(cardCvv)) {
                if (errEl) errEl.textContent = 'CVV inválido. Deve ter 3 ou 4 dígitos.';
                return;
            }

            cartItems = {};
            saveCart();
            updateCartBadge();
            renderCartModal();
            closeCartModal();
            showConfirmation(total, data.name, data.address, data.city);
        });
    }

    const cancel = document.getElementById('cancel-checkout');
    if (cancel) cancel.addEventListener('click', function () {
        modal.classList.remove('show');
    });
}

function showConfirmation(total, name, address, city) {
    console.log('showConfirmation called', { total, name, address, city });
    let modal = document.getElementById('checkout-modal');
    let body = document.getElementById('checkout-modal-body');

    if (!modal || !body) {
        modal = document.createElement('div');
        modal.id = 'checkout-modal';
        modal.className = 'cart-modal';
        modal.innerHTML = `
            <div class="cart-modal-content">
                <button class="close-cart" id="close-checkout">×</button>
                <h3><img src="./Assets/Image/daisyIcon.png" alt="Daisy Icon"> Últimos passos...</h3>
                <div id="checkout-modal-body"></div>
            </div>`;
        document.body.appendChild(modal);
        body = document.getElementById('checkout-modal-body');
        modal.querySelector('#close-checkout').addEventListener('click', () => modal.classList.remove('show'));
    }
    const displayName = name ? name : '';
    body.innerHTML = `
        <div class="confirm-message">
            <h3><img src="./Assets/Image/daisyIcon.png" alt="Daisy Icon"> Obrigado pela sua compra!</h3>
            <p>Estamos felizes que você tenha adquirido nossos produtos<strong>${displayName ? ', ' + displayName : ''}</strong>.</p>
            <p>Enviaremos seu pedido para: <strong>${address || ''}${city ? ', ' + city : ''}</strong></p>
            <p class="confirm-total">Total pago: <strong>${formatCurrency(total)}</strong></p>
            <p style="margin-top:1rem;"><strong>Deus abençoe!</strong></p>
            <div style="margin-top:1rem; text-align:right;"><button id="close-confirm" class="confirm">Fechar</button></div>
        </div>
    `;

    modal.classList.add('show');
    const closeBtn = document.getElementById('close-confirm');
    if (closeBtn) closeBtn.addEventListener('click', function () {
        modal.classList.remove('show');
    });
    setTimeout(() => {
        if (modal.classList.contains('show')) modal.classList.remove('show');
    }, 30000);
}

window.filterByCategory = filterByCategory;

renderCards();

document.addEventListener('DOMContentLoaded', () => {
    const categoryHeaders = document.querySelectorAll('.questions-items');

    categoryHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const parentDl = header.parentElement;

            parentDl.classList.toggle('active');

            const icon = header.querySelector('.bi-chevron-up');
            if (icon) {
                icon.style.transform = parentDl.classList.contains('active')
                    ? 'rotate(180deg)'
                    : 'rotate(0deg)';
            }
        });
    });

    const questionTerms = document.querySelectorAll('dt');

    questionTerms.forEach(dt => {
        dt.addEventListener('click', (e) => {
            e.stopPropagation();

            dt.classList.toggle('active');

            const icon = dt.querySelector('.bi-chevron-up');
            if (icon) {
                icon.style.transform = dt.classList.contains('active')
                    ? 'rotate(180deg)'
                    : 'rotate(0deg)';
            }
        });
    });
});