// src/TeamMembers.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        // Make an API call to fetch team members
        const response = await axios.get('http://localhost:9000/mccs/team-members');
        console.log(response)
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
