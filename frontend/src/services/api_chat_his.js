// POST /chat
async function saveChat(userId, messages) {
  await fetch('http://localhost:5000/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      messages: messages
    })
  });
}

// GET /chat/:user_id
async function getChatHistory(userId) {
  const res = await fetch(`http://localhost:5000/chat/${userId}`);
  const data = await res.json();
  return data;
}
