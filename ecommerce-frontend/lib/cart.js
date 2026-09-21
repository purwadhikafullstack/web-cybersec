const CART_KEY = 'ecom_cart';

function getCart() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  if (typeof window === 'undefined') return items;
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
  return items;
}

function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existing = cart.find((i) => i.productId === product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      quantity,
    });
  }
  return saveCart(cart);
}

function updateQuantity(productId, quantity) {
  const cart = getCart()
    .map((i) => (i.productId === productId ? { ...i, quantity } : i))
    .filter((i) => i.quantity > 0);
  return saveCart(cart);
}

function removeFromCart(productId) {
  const cart = getCart().filter((i) => i.productId !== productId);
  return saveCart(cart);
}

function clearCart() {
  return saveCart([]);
}

export { getCart, saveCart, addToCart, updateQuantity, removeFromCart, clearCart };
