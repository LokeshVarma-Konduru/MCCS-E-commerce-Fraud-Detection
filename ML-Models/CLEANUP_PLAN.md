# ML-Models Folder Cleanup Plan

## Current State Analysis

### Files Found (Total: ~1.35 GB)

#### 📁 Root Directory
1. **Data Files** (1.33 GB - IEEE-CIS Competition Data)
   - `train_transaction.csv` (683 MB) ⚠️ LARGE
   - `test_transaction.csv` (613 MB) ⚠️ LARGE
   - `train_identity.csv` (26.5 MB)
   - `test_identity.csv` (25.8 MB)
   - `sample_submission.csv` (6 MB)
   - `Fraudulent_E-Commerce_Transaction_Data_2.csv` (6 MB) ✅ KEEP

2. **Scripts**
   - `validate_ieee_cis.py` (13.8 KB) ✅ KEEP
   - `pbl_group1_preprocessing.py` (22 KB) ⚠️ MODIFIED FOR IEEE-CIS
   - `retrieve_models_from_mongodb.py` (4.6 KB) ✅ KEEP
   - `extract_mccs_results.py` (2.4 KB) ✅ KEEP
   - `check_mongodb_results.py` (3.3 KB) 🔧 UTILITY
   - `test.py` (249 bytes) ❌ DELETE

3. **Notebooks**
   - `PBL_Group1_PreProcessing.ipynb` (6.2 MB) ⚠️ OLD VERSION
   - `PBL_Group1_PreProcessing_sid.ipynb` (8.9 MB) ⚠️ DUPLICATE

4. **Documentation**
   - `MCCS_vs_IEEE_COMPARISON.md` (12.5 KB) ✅ KEEP
   - `METHODOLOGY_VALIDATION_REPORT.md` (11.5 KB) ✅ KEEP
   - `DEMO_SCRIPT.md` (8.6 KB) ✅ KEEP
   - `requirements.txt` (173 bytes) ✅ KEEP

#### 📁 ML_Server Directory
1. **Production Models**
   - `xgboost_pipeline.pkl` (727 KB) ✅ KEEP - MCCS Production Model
   - `predict_service.py` (1.7 KB) ✅ KEEP - Flask API

2. **Validation Models**
   - `transformer_ieee_cis.pkl` (93 KB) ✅ KEEP - IEEE-CIS Validation
   - `xgb_model_ieee_cis.json` (11.3 MB) ✅ KEEP - IEEE-CIS Validation

3. **Results**
   - `ieee_cis_evaluation_results.json` (1.7 KB) ✅ KEEP
   - `mccs_model_results.json` (1.3 KB) ✅ KEEP

---

## Cleanup Actions

### ❌ Files to DELETE (1.33 GB freed)

1. **IEEE-CIS Raw Data** (can re-download if needed)
   - `train_transaction.csv` (683 MB)
   - `test_transaction.csv` (613 MB)
   - `train_identity.csv` (26.5 MB)
   - `test_identity.csv` (25.8 MB)
   - `sample_submission.csv` (6 MB)
   - **Reason:** Validation complete, results saved, data takes 1.33 GB

2. **Test Script**
   - `test.py` (249 bytes)
   - **Reason:** Simple test script, not needed

3. **Duplicate Notebooks**
   - `PBL_Group1_PreProcessing_sid.ipynb` (8.9 MB)
   - **Reason:** Duplicate version

### 🔧 Files to MOVE/ARCHIVE

1. **Old Notebooks** → Create `archive/` folder
   - `PBL_Group1_PreProcessing.ipynb` (6.2 MB)
   - **Reason:** Historical reference, but not actively used

2. **Utility Scripts** → Create `utils/` folder
   - `check_mongodb_results.py`
   - `extract_mccs_results.py`
   - `retrieve_models_from_mongodb.py`
   - **Reason:** Utility scripts, keep organized

### ✅ Files to KEEP (Root)

1. **Core Data**
   - `Fraudulent_E-Commerce_Transaction_Data_2.csv` - MCCS training data

2. **Production Scripts**
   - `validate_ieee_cis.py` - Validation script
   - `pbl_group1_preprocessing.py` - Preprocessing (needs cleanup)
   - `requirements.txt` - Dependencies

3. **Documentation**
   - `MCCS_vs_IEEE_COMPARISON.md` - Advisor report
   - `METHODOLOGY_VALIDATION_REPORT.md` - Technical report
   - `DEMO_SCRIPT.md` - Demo guide

### ✅ Files to KEEP (ML_Server)

All files in ML_Server are production-critical:
- `xgboost_pipeline.pkl` - MCCS model
- `predict_service.py` - Flask API
- `transformer_ieee_cis.pkl` - Validation model
- `xgb_model_ieee_cis.json` - Validation model
- `ieee_cis_evaluation_results.json` - Validation results
- `mccs_model_results.json` - MCCS results

---

## Recommended Folder Structure

```
ML-Models/
├── README.md                                    [NEW - Create]
├── requirements.txt                             [KEEP]
├── Fraudulent_E-Commerce_Transaction_Data_2.csv [KEEP]
│
├── scripts/                                     [NEW - Create]
│   ├── validate_ieee_cis.py                    [MOVE]
│   └── pbl_group1_preprocessing.py             [MOVE - Cleanup]
│
├── utils/                                       [NEW - Create]
│   ├── check_mongodb_results.py                [MOVE]
│   ├── extract_mccs_results.py                 [MOVE]
│   └── retrieve_models_from_mongodb.py         [MOVE]
│
├── docs/                                        [NEW - Create]
│   ├── MCCS_vs_IEEE_COMPARISON.md              [MOVE]
│   ├── METHODOLOGY_VALIDATION_REPORT.md        [MOVE]
│   └── DEMO_SCRIPT.md                          [MOVE]
│
├── archive/                                     [NEW - Create]
│   └── PBL_Group1_PreProcessing.ipynb          [MOVE]
│
├── ML_Server/                                   [KEEP AS IS]
│   ├── predict_service.py
│   ├── xgboost_pipeline.pkl
│   ├── transformer_ieee_cis.pkl
│   ├── xgb_model_ieee_cis.json
│   ├── ieee_cis_evaluation_results.json
│   └── mccs_model_results.json
│
└── .gitignore                                   [NEW - Create]
```

---

## Space Savings

| Category | Before | After | Saved |
|----------|--------|-------|-------|
| IEEE-CIS Data | 1.33 GB | 0 GB | 1.33 GB |
| Notebooks | 15.1 MB | 0 MB (archived) | 15.1 MB |
| Test Scripts | 249 bytes | 0 bytes | 249 bytes |
| **Total** | **1.35 GB** | **~20 MB** | **~1.33 GB** |

---

## Code Cleanup Tasks

### 1. Fix `pbl_group1_preprocessing.py`
**Issue:** Modified for IEEE-CIS data, should be MCCS-focused
**Action:** Create separate scripts or restore MCCS functionality

### 2. Add README.md
**Action:** Document folder structure and usage

### 3. Add .gitignore
**Action:** Exclude large data files and models from git

### 4. Update requirements.txt
**Action:** Ensure all dependencies are listed with versions

---

## Execution Priority

1. ✅ **HIGH PRIORITY** - Delete IEEE-CIS data (1.33 GB freed)
2. ✅ **HIGH PRIORITY** - Create folder structure
3. ✅ **MEDIUM PRIORITY** - Move files to new structure
4. ✅ **MEDIUM PRIORITY** - Create README.md
5. ✅ **LOW PRIORITY** - Create .gitignore
6. ✅ **LOW PRIORITY** - Archive old notebooks
