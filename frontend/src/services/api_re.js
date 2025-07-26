

// POST http://localhost:5000/register
async function registerUser(user) {
  const res = await fetch('http://localhost:5000/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
  const data = await res.json();
  return data;
}
