import mongoose from "mongoose";
const { Schema } = mongoose;

const teamSchema = new Schema(
  {
    teamMemberName: {
      type: String,
      trim: true,
      unique: true,
      required: true,
    },
    teamMemberMail: {
      type: String,
      trim: true,
      unique: true,
      required: true,
    }
  },
  { timestamps: true }
);

export default mongoose.model("Team", teamSchema);
