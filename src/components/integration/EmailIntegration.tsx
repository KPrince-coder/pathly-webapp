'use client';

import { useEffect, useState } from 'react';
import { FiMail } from 'react-icons/fi';

const EmailIntegration: React.FC = () => {
  const [emails, setEmails] = useState([]);

  useEffect(() => {
    const fetchEmails = async () => {
      // Logic to fetch emails and convert to notes/tasks
      const fetchedEmails = []; // Dummy data
      setEmails(fetchedEmails);
    };

    fetchEmails();
  }, []);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold">Email Integration</h3>
      <ul className="mt-2">
        {emails.map((email, index) => (
          <li key={index} className="text-blue-500">{email}</li>
        ))}
      </ul>
    </div>
  );
};

export default EmailIntegration;
