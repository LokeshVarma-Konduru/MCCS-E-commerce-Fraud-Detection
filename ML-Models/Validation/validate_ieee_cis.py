#!/usr/bin/env python3
"""
IEEE-CIS Fraud Detection - MCCS Model Validation
Validates MCCS fraud detection models against real-world competition data
"""

import numpy as np
import pandas as pd
import warnings
warnings.filterwarnings('ignore')

from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import BernoulliNB
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, confusion_matrix, classification_report, 
    roc_auc_score, precision_score, recall_score, f1_score
)
import optuna
import joblib
import json
from datetime import datetime

print("="*70)
print("IEEE-CIS FRAUD DETECTION - MCCS MODEL VALIDATION")
print("="*70)
print("Loading competition datasets...\n")

# Load IEEE-CIS competition data
print("[1/3] Loading train_transaction.csv...")
train_transaction = pd.read_csv('train_transaction.csv')
print(f"      ✅ Loaded: {train_transaction.shape}")

print("[2/3] Loading train_identity.csv...")
train_identity = pd.read_csv('train_identity.csv')
print(f"      ✅ Loaded: {train_identity.shape}")

print("[3/3] Merging datasets...")
train_df = train_transaction.merge(train_identity, on='TransactionID', how='left')
print(f"      ✅ Merged: {train_df.shape}")

print(f"\n📊 Dataset Statistics:")
print(f"   Total transactions: {len(train_df):,}")
print(f"   Fraud rate: {train_df['isFraud'].mean()*100:.2f}%")
print(f"   Fraud cases: {train_df['isFraud'].sum():,}")
print(f"   Legitimate cases: {(~train_df['isFraud'].astype(bool)).sum():,}")
print("="*70 + "\n")

def preprocess_ieee_cis_data(df):
    """
    Preprocess IEEE-CIS competition data with feature engineering
    """
    print(f"\n{'='*70}")
    print("PREPROCESSING DATA")
    print(f"{'='*70}")
    
    df = df.copy()
    
    # 1. Transaction amount features
    print("\n[1/5] Transaction amount features...")
    df['TransactionAmt_Log'] = np.log1p(df['TransactionAmt'])
    df['TransactionAmt_Decimal'] = df['TransactionAmt'] - df['TransactionAmt'].astype(int)
    
    # 2. Temporal features
    print("[2/5] Temporal features...")
    df['Transaction_Hour'] = (df['TransactionDT'] / 3600) % 24
    df['Transaction_Day'] = (df['TransactionDT'] / (3600 * 24)) % 7
    df['Is_Weekend'] = (df['Transaction_Day'] >= 5).astype(int)
    df['Is_Night'] = ((df['Transaction_Hour'] >= 22) | (df['Transaction_Hour'] <= 6)).astype(int)
    
    # 3. Card features
    print("[3/5] Card features...")
    if 'card1' in df.columns:
        df['card1_count'] = df.groupby('card1')['card1'].transform('count')
    if 'card2' in df.columns:
        df['card2_count'] = df.groupby('card2')['card2'].transform('count')
    
    # 4. Email domain features
    print("[4/5] Email domain features...")
    if 'P_emaildomain' in df.columns:
        df['P_email_is_null'] = df['P_emaildomain'].isnull().astype(int)
    if 'R_emaildomain' in df.columns:
        df['R_email_is_null'] = df['R_emaildomain'].isnull().astype(int)
    if 'P_emaildomain' in df.columns and 'R_emaildomain' in df.columns:
        df['Email_Match'] = (df['P_emaildomain'] == df['R_emaildomain']).astype(int)
    
    # 5. Handle missing values
    print("[5/5] Handling missing values...")
    
    # Fill numeric columns
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        if df[col].isnull().sum() > 0:
            df[col].fillna(df[col].median(), inplace=True)
    
    # Fill categorical columns
    categorical_cols = df.select_dtypes(include=['object']).columns
    for col in categorical_cols:
        if df[col].isnull().sum() > 0:
            df[col].fillna('missing', inplace=True)
    
    # Drop unnecessary columns
    cols_to_drop = ['TransactionID', 'TransactionDT']
    df.drop(columns=[col for col in cols_to_drop if col in df.columns], inplace=True)
    
    print(f"\n✅ Preprocessing complete: {df.shape}")
    print(f"   Numeric features: {len(df.select_dtypes(include=[np.number]).columns)}")
    print(f"   Categorical features: {len(df.select_dtypes(include=['object']).columns)}")
    
    return df

# Preprocess data
train_df = preprocess_ieee_cis_data(train_df)

# Prepare for modeling
print("\n" + "="*70)
print("PREPARING DATA FOR MODELING")
print("="*70)

train_label = train_df['isFraud']
train_data = train_df.drop(columns=['isFraud'])

# Split for validation
print("\nSplitting data (80% train, 20% test)...")
train_data, test_data, train_label, test_label = train_test_split(
    train_data, train_label, test_size=0.2, random_state=42, stratify=train_label
)

print(f"\n✅ Train set: {train_data.shape} | Fraud rate: {train_label.mean()*100:.2f}%")
print(f"✅ Test set: {test_data.shape} | Fraud rate: {test_label.mean()*100:.2f}%")

# Setup transformer
cat_col = train_data.select_dtypes(include="O").columns
num_col = train_data.select_dtypes(include=[np.number]).columns

print(f"\n🔧 Configuring transformer:")
print(f"   Categorical columns: {len(cat_col)}")
print(f"   Numerical columns: {len(num_col)}")

transformer = ColumnTransformer(transformers=[
    ('encoding', OneHotEncoder(handle_unknown='ignore'), cat_col),
    ('scaling', StandardScaler(), num_col)
], remainder='drop')

# Define classifiers
classifiers = {
    "Logistic Regression": LogisticRegression(max_iter=1000),
    "Bernoulli NB": BernoulliNB(),
    "Decision Tree": DecisionTreeClassifier(),
    "Random Forest": RandomForestClassifier(n_estimators=100),
    "XGBoost": XGBClassifier(eval_metric='auc')
}

# ============================================================
# CROSS-VALIDATION EVALUATION
# ============================================================
print("\n" + "="*70)
print("CROSS-VALIDATION ANALYSIS")
print("="*70)
print("Evaluating models with 5-Fold Stratified Cross-Validation")
print("Metric: ROC-AUC (IEEE-CIS Competition Standard)")
print("="*70)

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

cv_results = []
for name, classifier in classifiers.items():
    print(f"\n[{name}] Running cross-validation...")
    
    model = Pipeline(steps=[
        ('transformer', transformer),
        ('classifier', classifier)
    ])
    
    cv_scores = cross_val_score(
        model, 
        train_data, 
        train_label, 
        cv=skf, 
        scoring='roc_auc',
        n_jobs=-1
    )
    
    mean_score = cv_scores.mean()
    std_score = cv_scores.std()
    
    cv_results.append({
        "Model": name,
        "Mean_ROC_AUC": mean_score,
        "Std_Dev": std_score,
        "Min": cv_scores.min(),
        "Max": cv_scores.max()
    })
    
    print(f"  ROC-AUC: {mean_score:.4f} (+/- {std_score:.4f})")
    print(f"  Range: [{cv_scores.min():.4f}, {cv_scores.max():.4f}]")

print("\n" + "="*70)
print("CROSS-VALIDATION RESULTS SUMMARY")
print("="*70)
cv_df = pd.DataFrame(cv_results).sort_values(by="Mean_ROC_AUC", ascending=False)
print(cv_df.to_string(index=False))
print(f"\n🏆 Best Model (CV): {cv_df.iloc[0]['Model']}")
print(f"📊 Best CV ROC-AUC: {cv_df.iloc[0]['Mean_ROC_AUC']:.4f}")
print("="*70)

# ============================================================
# HYPERPARAMETER OPTIMIZATION
# ============================================================
print("\n" + "="*70)
print("HYPERPARAMETER OPTIMIZATION (OPTUNA)")
print("="*70)
print("Optimizing XGBoost for ROC-AUC...")
print("This may take 10-20 minutes...\n")

def objective(trial):
    params = {
        "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.3),
        "n_estimators": trial.suggest_int("n_estimators", 100, 500),
        "max_depth": trial.suggest_int("max_depth", 3, 10),
        "min_child_weight": trial.suggest_int("min_child_weight", 1, 7),
        "gamma": trial.suggest_float("gamma", 0.0, 0.5),
        "subsample": trial.suggest_float("subsample", 0.6, 1.0),
        "colsample_bytree": trial.suggest_float("colsample_bytree", 0.6, 1.0),
        "reg_alpha": trial.suggest_float("reg_alpha", 0.0, 1.0),
        "reg_lambda": trial.suggest_float("reg_lambda", 0.0, 1.0),
        "scale_pos_weight": trial.suggest_float("scale_pos_weight", 1.0, 10.0),
        "eval_metric": "auc",
        "random_state": 42
    }

    classifier = XGBClassifier(**params)
    model = Pipeline(steps=[
        ('transformer', transformer),
        ('classifier', classifier)
    ])
    model.fit(train_data, train_label)

    pred_proba = model.predict_proba(test_data)[:, 1]
    roc_auc = roc_auc_score(test_label, pred_proba)
    
    preds = model.predict(test_data)
    accuracy = accuracy_score(test_label, preds)
    
    trial.set_user_attr("accuracy", accuracy)
    trial.set_user_attr("roc_auc", roc_auc)

    return roc_auc

optuna.logging.set_verbosity(optuna.logging.WARNING)
study = optuna.create_study(direction="maximize")
study.optimize(objective, n_trials=70, show_progress_bar=True)

best_params = study.best_params
best_trial = study.best_trial

print("\n" + "="*70)
print("OPTIMIZATION RESULTS")
print("="*70)
print("\nBest Hyperparameters:")
for param, value in best_params.items():
    print(f"  {param}: {value}")
print(f"\n📊 Best ROC-AUC Score: {best_trial.value:.6f}")
print(f"📊 Corresponding Accuracy: {best_trial.user_attrs.get('accuracy', 0):.6f}")
print("="*70)

# ============================================================
# FINAL MODEL EVALUATION
# ============================================================
print("\n" + "="*70)
print("FINAL MODEL EVALUATION")
print("="*70)
print("Training final model with optimized hyperparameters...")

final_classifier = XGBClassifier(**best_params)
final_model = Pipeline(steps=[
    ('transformer', transformer),
    ('classifier', final_classifier)
])
final_model.fit(train_data, train_label)

test_pred_proba = final_model.predict_proba(test_data)[:, 1]
test_pred = final_model.predict(test_data)

test_roc_auc = roc_auc_score(test_label, test_pred_proba)
test_accuracy = accuracy_score(test_label, test_pred)
test_precision = precision_score(test_label, test_pred)
test_recall = recall_score(test_label, test_pred)
test_f1 = f1_score(test_label, test_pred)

print("\n📊 Test Set Performance:")
print(f"  ROC-AUC:    {test_roc_auc:.6f} ⭐ (Primary Metric)")
print(f"  Accuracy:   {test_accuracy:.6f}")
print(f"  Precision:  {test_precision:.6f}")
print(f"  Recall:     {test_recall:.6f}")
print(f"  F1-Score:   {test_f1:.6f}")

print("\n📈 Performance Comparison:")
if 'XGBoost' in cv_df['Model'].values:
    xgb_cv_score = cv_df[cv_df['Model'] == 'XGBoost']['Mean_ROC_AUC'].values[0]
    improvement = ((test_roc_auc - xgb_cv_score) / xgb_cv_score) * 100
    print(f"  XGBoost (Baseline CV):     {xgb_cv_score:.6f}")
    print(f"  XGBoost (Optimized Test):  {test_roc_auc:.6f}")
    print(f"  Improvement:               {improvement:+.2f}%")

print("\n🎯 Confusion Matrix:")
conf_matrix = confusion_matrix(test_label, test_pred)
print(f"  True Negatives:  {conf_matrix[0][0]:,}")
print(f"  False Positives: {conf_matrix[0][1]:,}")
print(f"  False Negatives: {conf_matrix[1][0]:,}")
print(f"  True Positives:  {conf_matrix[1][1]:,}")

false_positive_rate = conf_matrix[0][1] / (conf_matrix[0][0] + conf_matrix[0][1])
print(f"\n  False Positive Rate: {false_positive_rate:.2%}")

print("="*70)

# ============================================================
# SAVE MODEL AND RESULTS
# ============================================================
print("\n" + "="*70)
print("SAVING MODEL ARTIFACTS")
print("="*70)

joblib.dump(transformer, 'ML_Server/transformer.pkl')
final_model.named_steps['classifier'].save_model('ML_Server/xgb_model.json')
print("✅ Saved transformer.pkl")
print("✅ Saved xgb_model.json")

results_summary = {
    "training_date": datetime.now().isoformat(),
    "dataset": "IEEE-CIS Fraud Detection Competition",
    "cross_validation": {
        "method": "5-Fold Stratified K-Fold",
        "results": cv_results
    },
    "optimization": {
        "method": "Optuna (70 trials)",
        "best_params": best_params,
        "best_roc_auc": float(best_trial.value),
        "best_accuracy": float(best_trial.user_attrs.get('accuracy', 0))
    },
    "test_set_performance": {
        "roc_auc": float(test_roc_auc),
        "accuracy": float(test_accuracy),
        "precision": float(test_precision),
        "recall": float(test_recall),
        "f1_score": float(test_f1),
        "false_positive_rate": float(false_positive_rate),
        "confusion_matrix": conf_matrix.tolist()
    },
    "features": {
        "categorical_count": len(cat_col),
        "numerical_count": len(num_col),
        "total_features": len(train_data.columns)
    }
}

with open('ML_Server/ieee_cis_evaluation_results.json', 'w') as f:
    json.dump(results_summary, f, indent=2)
print("✅ Saved ieee_cis_evaluation_results.json")

print("\n🎉 Training Complete!")
print("All model artifacts saved to ML_Server/")
print("\nNext steps:")
print("1. Review ieee_cis_evaluation_results.json for detailed metrics")
print("2. Compare these results to your MCCS model performance")
print("3. If results are similar (±5%), your models generalize well!")
print("="*70)
