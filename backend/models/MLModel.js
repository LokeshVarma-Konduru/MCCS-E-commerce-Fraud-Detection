import mongoose from 'mongoose';

const MetricSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
});

const PlotSchema = new mongoose.Schema({
  type: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  layout: { type: mongoose.Schema.Types.Mixed },
});

const ModelSchema = new mongoose.Schema({
  modelName: { type: String, required: true },
  modelType: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  metrics: [MetricSchema],
  plots: [PlotSchema],
  additionalInfo: { type: mongoose.Schema.Types.Mixed }
},
{ timestamps: true }
);

export default mongoose.model('MLModel', ModelSchema);
