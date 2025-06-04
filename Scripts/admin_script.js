document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('cardForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const newCard = {
      title: formData.get('title'),
      url: formData.get('url'),
      category: formData.get('category'),
      subtitle: formData.get('subtitle'),
      description: formData.get('description')
    };
    try {
      const stored = JSON.parse(localStorage.getItem('cardsDataALDMC')) || [];
      stored.push(newCard);
      localStorage.setItem('cardsDataALDMC', JSON.stringify(stored));
      form.reset();
      alert('Card added successfully');
    } catch (err) {
      console.error('Error saving card data:', err);
      alert('Error saving card data');
    }
  });
});
