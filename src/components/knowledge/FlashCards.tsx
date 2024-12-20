'use client';

import { useState } from 'react';
import { FiBook } from 'react-icons/fi';

const FlashCards: React.FC = () => {
  const [cards, setCards] = useState([{ question: 'What is AI?', answer: 'Artificial Intelligence' }]);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold">Flash Cards</h3>
      <ul className="mt-2">
        {cards.map((card, index) => (
          <li key={index} className="border-b py-2">
            <strong>{card.question}</strong>: {card.answer}
          </li>
        ))}
      </ul>
      <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded flex items-center gap-2">
        <FiBook /> Add Flash Card
      </button>
    </div>
  );
};

export default FlashCards;
