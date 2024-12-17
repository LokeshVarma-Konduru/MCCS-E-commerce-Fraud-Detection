# MCCS E-commerce Fraud Detection

A comprehensive e-commerce fraud detection system with separate backend, frontend, and machine learning components.

## Project Structure

The project consists of three main components:
- `backend/`: Node.js backend server with Express
- `frontend/`: React-based frontend application using Vite and TailwindCSS
- `ML-Models/`: Python-based Machine Learning models for fraud detection

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Python 3.x (for ML models)
- npm or yarn package manager

## Installation

1. Clone the repository:

For main branch:
```bash
git clone https://github.com/LokeshVarma-Konduru/MCCS-E-commerce-Fraud-Detection.git
cd MCCS-E-commerce-Fraud-Detection
```

For specific branch:
```bash
git clone -b <branch-name> https://github.com/LokeshVarma-Konduru/MCCS-E-commerce-Fraud-Detection.git
cd MCCS-E-commerce-Fraud-Detection
```

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
npm install
```

2. Configure environment variables:
Create a `.env` file in the backend directory with the following:
```env
MONGO_URI=your_mongodb_url
PORT=9000
FRONTEND_URL=your_frontend_url
JWT_SECRET=your_secret_key

# Node mailer configuration for sending emails
EMAIL_USER=your_email_id
EMAIL_PASS=your_email_pass

NODE_ENV=development
```

3. Start the backend server:
```bash
npm start
```

4. Run tests (optional):
```bash
npm test
```
The backend includes Jest-based unit tests in the `tests` directory.

The backend includes:
- Express.js server
- MongoDB integration
- JWT authentication
- Email functionality with Nodemailer
- API routes in the `routes` directory
- Controllers in the `controllers` directory
- MongoDB models in the `models` directory

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm run dev
```

The frontend includes:
- React 18
- Vite build tool
- TailwindCSS for styling
- Chart.js and Plotly.js for data visualization
- Axios for API requests
- ESLint for code quality

### ML-Models Setup

1. Download the required datasets:
   - Visit [Kaggle - Fraud Prediction](https://www.kaggle.com/code/veerpatel6693/fraud-prediction)
   - Download the dataset files and place them in the `ML-Models` directory:
     - `Fraudulent_E-Commerce_Transaction_Data.csv`
     - `Fraudulent_E-Commerce_Transaction_Data_2.csv`

2. Navigate to the ML-Models directory:
```bash
cd ML-Models
```

3. Set up Python environment and install dependencies:
```bash
pip install -r requirements.txt
```

Required Python packages include:
- numpy
- pandas
- matplotlib
- seaborn
- plotly
- scikit-learn
- xgboost
- optuna
- pymongo
- python-dotenv

4. Configure environment variables:
Create a `.env` file in the ML-Models directory with:
```env
MONGODB_URL=your_mongodb_url
DB=your_database_name
COLLECTION=your_collection_name
```

5. Run the preprocessing script:
```bash
python pbl_group1_preprocessing.py
```

## Running the Application

1. Start the backend server:
```bash
cd backend
npm start
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

3. Process ML models:
```bash
cd ML-Models
python pbl_group1_preprocessing.py
```

## Environment Variables

### Backend Environment Variables
- `MONGO_URI`: MongoDB connection string
- `PORT`: Server port (default: 9000)
- `FRONTEND_URL`: URL of the frontend application
- `JWT_SECRET`: Secret key for JWT authentication
- `EMAIL_USER`: Email for nodemailer service
- `EMAIL_PASS`: Password for email service
- `NODE_ENV`: Development/production environment

### ML-Models Environment Variables
- `MONGODB_URL`: MongoDB connection URL
- `DB`: Database name
- `COLLECTION`: Collection name

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


