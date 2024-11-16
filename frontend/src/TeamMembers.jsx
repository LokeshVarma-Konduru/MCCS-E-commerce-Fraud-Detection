// src/TeamMembers.js

import React, { useEffect, useState } from 'react';
import { getTeamMembers } from './api';

const TeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        // Use the API abstraction to fetch team members
        const response = await getTeamMembers();
        setTeamMembers(response.data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h2>Team Members</h2>
      {teamMembers.length ? (
        <ul>
          {teamMembers.map((member) => (
            <li key={member._id}>
              <strong>{member.teamMemberName}</strong> - {member.teamMemberMail}
            </li>
          ))}
        </ul>
      ) : (
        <p>No team members found</p>
      )}
    </div>
  );
};

export default TeamMembers;
