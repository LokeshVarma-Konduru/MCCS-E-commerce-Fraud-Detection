import MLModel from "../models/MLModel.js";
// Controller to get all models
export const getAllModels = async (req, res) => {
    try {
        const models = await MLModel.find();
        res.status(200).json({
            success: true,
            data: models
        });
    } catch (error) {
        console.error('Error fetching models:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
};

// Controller to get a model by ID
export const getModelById = async (req, res) => {
    try {
        const model = await MLModel.findById(req.params.id);
        if (!model) {
            return res.status(404).json({
                success: false,
                message: 'Model not found',
            });
        }
        res.status(200).json({
            success: true,
            data: model,
        });
    } catch (error) {
        console.error('Error fetching model:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
};
