import Team from "../models/team.js";

export const getAllTeamMembers = async (req, res) => {
    try {
      // Fetch all team members from the database
      const teamMembers = await Team.find({})
      
      // Check if there are any team members
      if (!teamMembers.length) {
        return res.status(404).json({
          success: false,
          message: 'No team members found'
        });
      }
  
      // Return success response with team members data
      return res.status(200).json({
        success: true,
        count: teamMembers.length,
        data: teamMembers
      });
  
    } catch (error) {
      // Handle any errors
      return res.status(500).json({
        success: false,
        message: 'Error fetching team members',
        error: error.message
      });
    }
  };

  export const addTeamMembers = async (req, res) => {
    try {
      // Validate request body
      if (!req.body.members || !Array.isArray(req.body.members) || req.body.members.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide an array of team members'
        });
      }
  
      // Validate each member object
      for (const member of req.body.members) {
        if (!member.teamMemberName || !member.teamMemberMail) {
          return res.status(400).json({
            success: false,
            message: 'Each team member must have teamMemberName and teamMemberMail'
          });
        }
      }
  
      // Insert multiple documents
      const insertedMembers = await Team.insertMany(req.body.members, {
        ordered: false // Continue inserting even if some documents fail
      });
  
      return res.status(201).json({
        success: true,
        message: `Successfully added ${insertedMembers.length} team members`,
        data: insertedMembers
      });
  
    } catch (error) {
      // Check for duplicate key errors
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Duplicate entries found. Each name and email must be unique.',
          error: error.message
        });
      }
  
      return res.status(500).json({
        success: false,
        message: 'Error adding team members',
        error: error.message
      });
    }
  };
  