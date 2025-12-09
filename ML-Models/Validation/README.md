# ML Model Validation

This folder contains all validation scripts, comparison reports, and methodology documentation for the MCCS Fraud Detection ML models.

## 📁 Contents

### **IEEE-CIS Dataset Files**

This folder contains the IEEE-CIS Fraud Detection dataset used for validation:

- **train_transaction.csv** - Training transaction data (~683MB)
- **train_identity.csv** - Training identity data (~27MB)
- **test_transaction.csv** - Test transaction data (~613MB)
- **test_identity.csv** - Test identity data (~26MB)
- **sample_submission.csv** - Sample submission format (~6MB)

**Note:** These large dataset files are used by `validate_ieee_cis.py` for model validation.

---

### **Validation Scripts**

#### **validate_ieee_cis.py**
Main validation script that compares MCCS model performance against IEEE-CIS Fraud Detection dataset.

**Purpose:**
- Validates MCCS model methodology using industry-standard IEEE-CIS dataset
- Compares performance metrics (AUC-ROC, precision, recall, F1-score)
- Ensures model generalization across different datasets

**Usage:**
```bash
python validate_ieee_cis.py
```

#### **extract_mccs_results.py**
Extracts and processes MCCS model results from MongoDB for comparison analysis.

**Purpose:**
- Retrieves model predictions and metrics from production database
- Formats data for validation comparison
- Generates performance summaries

**Usage:**
```bash
python extract_mccs_results.py
```

#### **retrieve_models_from_mongodb.py**
Retrieves trained model artifacts and metadata from MongoDB storage.

**Purpose:**
- Downloads model files from database
- Extracts model configuration and hyperparameters
- Prepares models for validation testing

**Usage:**
```bash
python retrieve_models_from_mongodb.py
```

#### **check_mongodb_results.py**
Utility script to verify and inspect MongoDB stored results.

**Purpose:**
- Validates data integrity in MongoDB
- Checks for missing or corrupted records
- Generates data quality reports

**Usage:**
```bash
python check_mongodb_results.py
```

---

### **Validation Reports**

#### **MCCS_vs_IEEE_COMPARISON.md**
Comprehensive comparison report between MCCS model and IEEE-CIS dataset validation.

**Contents:**
- Performance metrics comparison
- Model architecture analysis
- Feature importance comparison
- Recommendations for improvement

#### **METHODOLOGY_VALIDATION_REPORT.md**
Detailed methodology validation documentation.

**Contents:**
- Validation approach and rationale
- Dataset characteristics
- Experimental setup
- Results interpretation
- Conclusions and next steps

---

## 🚀 Quick Start

### **Prerequisites**
```bash
pip install -r ../requirements.txt
```

### **Run Full Validation**
```bash
# 1. Retrieve models from MongoDB
python retrieve_models_from_mongodb.py

# 2. Extract MCCS results
python extract_mccs_results.py

# 3. Run IEEE-CIS validation
python validate_ieee_cis.py

# 4. Check results
python check_mongodb_results.py
```

---

## 📊 Validation Metrics

The validation process evaluates:

- **AUC-ROC Score** - Area Under the Receiver Operating Characteristic Curve
- **Precision** - True Positives / (True Positives + False Positives)
- **Recall** - True Positives / (True Positives + False Negatives)
- **F1-Score** - Harmonic mean of Precision and Recall
- **Accuracy** - Overall correctness of predictions
- **False Positive Rate** - Critical for fraud detection systems

---

## 🎯 Validation Goals

1. **Methodology Verification**
   - Ensure MCCS approach is sound and industry-standard
   - Validate against established benchmarks (IEEE-CIS)

2. **Generalization Testing**
   - Test model performance on external datasets
   - Identify potential overfitting or bias

3. **Performance Benchmarking**
   - Compare against state-of-the-art fraud detection models
   - Establish baseline for future improvements

4. **Documentation**
   - Maintain comprehensive validation records
   - Support audit and compliance requirements

---

## 📝 Notes

- All validation scripts assume MongoDB connection is configured
- IEEE-CIS dataset must be downloaded separately (not included in repo)
- Validation reports are updated after each major model iteration
- Results are stored in MongoDB for historical tracking

---

## 🔗 Related Documentation

- **Main ML-Models README:** `../README.md`
- **Model Training:** `../pbl_group1_preprocessing.py`
- **Model Server:** `../ML_Server/`

---

**Last Updated:** December 9, 2025  
**Maintained By:** ML Engineering Team
