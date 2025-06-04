export async function fetchCart(token) {
  const res = await fetch(`${import.meta.env.REACT_APP_API_URL}/api/cart`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch cart');
  return res.json();
}

export async function addToCart(productId, quantity, token) {
  const res = await fetch(`${import.meta.env.REACT_APP_API_URL}/api/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ productId, quantity }),
  });
  if (!res.ok) throw new Error('Failed to add to cart');
  return res.json();
}

export async function removeFromCart(productId, token) {
  const res = await fetch(`${import.meta.env.REACT_APP_API_URL}/api/cart/${productId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to remove from cart');
  return res.json();
}
