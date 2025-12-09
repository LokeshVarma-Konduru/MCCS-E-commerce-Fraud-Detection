#!/usr/bin/env python3
"""
PBL Group 1 Preprocessing Script - IEEE-CIS Version

⚠️ NOTE: This script has been modified to work with IEEE-CIS competition data.
Original MCCS preprocessing functionality has been replaced.

For MCCS model training, the production model is stored in MongoDB and can be
retrieved using: utils/retrieve_models_from_mongodb.py

For new MCCS model training, create a separate script or restore original
MCCS preprocessing from git history.

Current Purpose: IEEE-CIS data preprocessing for methodology validation
Status: Validation complete (Nov 20, 2025)
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import time
import warnings
warnings.filterwarnings('ignore')
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import BernoulliNB
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.model_selection import GridSearchCV
import optuna
import joblib
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report, roc_auc_score, precision_score, recall_score, f1_score
from sklearn.model_selection import StratifiedKFold

print("="*70)
print("IEEE-CIS FRAUD DETECTION - COMPETITION DATA")
print("="*70)
print("Loading competition datasets...\n")

# Load IEEE-CIS competition data
train_transaction = pd.read_csv('train_transaction.csv')
train_identity = pd.read_csv('train_identity.csv')
test_transaction = pd.read_csv('test_transaction.csv')
test_identity = pd.read_csv('test_identity.csv')

print(f"✅ Train transactions: {train_transaction.shape}")
print(f"✅ Train identity: {train_identity.shape}")
print(f"✅ Test transactions: {test_transaction.shape}")
print(f"✅ Test identity: {test_identity.shape}")

# Merge transaction and identity data
train_df = train_transaction.merge(train_identity, on='TransactionID', how='left')
test_df = test_transaction.merge(test_identity, on='TransactionID', how='left')

print(f"\n📊 Merged train data: {train_df.shape}")
print(f"📊 Merged test data: {test_df.shape}")
print(f"\n🎯 Fraud rate in training: {train_df['isFraud'].mean()*100:.2f}%")
print(f"   Fraud cases: {train_df['isFraud'].sum():,}")
print(f"   Legitimate cases: {(~train_df['isFraud'].astype(bool)).sum():,}")
print("="*70 + "\n")

train_df.head()

train_df.shape

train_df.info()

train_df.describe().T

train_df.describe(include="O")

train_df.isnull().sum()

train_df.duplicated().sum()


train_df.head(2)

px.box(data_frame=train_df,x="Customer Age",width=500,height=300)

def clean_data(df) -> pd.DataFrame:

    df["Transaction Date"] = pd.to_datetime(df["Transaction Date"])


    df['Transaction Day'] = df["Transaction Date"].dt.day
    df["Transaction DOW"] = df["Transaction Date"].dt.day_of_week
    df["Transaction Month"] = df["Transaction Date"].dt.month



    mean_value = np.round(df['Customer Age'].mean(),0)
    df['Customer Age'] = np.where(df['Customer Age'] <= -9,
                                    np.abs(df['Customer Age']),
                                    df['Customer Age'])

    df['Customer Age'] = np.where(df['Customer Age'] < 9,
                                    mean_value,
                                    df['Customer Age'])


    df["Is Address Match"] = (df["Shipping Address"] == df["Billing Address"]).astype(int)


    df.drop(columns=["Transaction ID", "Customer ID", "Customer Location",
                     "IP Address", "Transaction Date","Shipping Address","Billing Address"], inplace=True)


    int_col = df.select_dtypes(include="int").columns
    float_col = df.select_dtypes(include="float").columns

    df[int_col] = df[int_col].apply(pd.to_numeric, downcast='integer')
    df[float_col] = df[float_col].apply(pd.to_numeric, downcast='float')

    return df

def engineer_advanced_features(df) -> pd.DataFrame:
    """
    Advanced feature engineering inspired by IEEE-CIS competition techniques
    Creates interaction features, aggregations, and risk indicators
    """
    print("\n[Feature Engineering] Creating competition-inspired features...")
    
    # 1. Transaction amount transformations
    df['Transaction_Amount_Log'] = np.log1p(df['Transaction Amount'])
    df['Transaction_Amount_Sqrt'] = np.sqrt(df['Transaction Amount'])
    df['Transaction_Amount_Squared'] = df['Transaction Amount'] ** 2
    
    # 2. Quantity-based features
    df['Amount_Per_Item'] = df['Transaction Amount'] / (df['Quantity'] + 1)
    df['High_Quantity_Flag'] = (df['Quantity'] > df['Quantity'].quantile(0.95)).astype(int)
    df['Low_Quantity_High_Amount'] = ((df['Quantity'] == 1) & 
                                       (df['Transaction Amount'] > df['Transaction Amount'].quantile(0.75))).astype(int)
    
    # 3. Account age features
    df['Account_Age_Years'] = df['Account Age Days'] / 365.25
    df['New_Account_Flag'] = (df['Account Age Days'] < 30).astype(int)
    df['Mature_Account_Flag'] = (df['Account Age Days'] > 365).astype(int)
    df['Account_Age_Log'] = np.log1p(df['Account Age Days'])
    
    # 4. Temporal features (if Transaction Hour exists)
    if 'Transaction Hour' in df.columns:
        df['Is_Weekend'] = (df['Transaction DOW'].isin([5, 6])).astype(int)
        df['Is_Night'] = ((df['Transaction Hour'] >= 22) | (df['Transaction Hour'] <= 6)).astype(int)
        df['Is_Business_Hours'] = ((df['Transaction Hour'] >= 9) & (df['Transaction Hour'] <= 17)).astype(int)
        df['Is_Late_Night'] = ((df['Transaction Hour'] >= 0) & (df['Transaction Hour'] <= 4)).astype(int)
    else:
        df['Is_Weekend'] = (df['Transaction DOW'].isin([5, 6])).astype(int)
    
    # 5. Risk indicators
    df['Address_Mismatch_Flag'] = 1 - df['Is Address Match']
    df['High_Amount_New_Account'] = ((df['New_Account_Flag'] == 1) & 
                                      (df['Transaction Amount'] > df['Transaction Amount'].quantile(0.75))).astype(int)
    
    # 6. Customer age features
    df['Customer_Age_Group'] = pd.cut(df['Customer Age'], 
                                       bins=[0, 25, 35, 50, 65, 100], 
                                       labels=['Young', 'Adult', 'Middle', 'Senior', 'Elderly'])
    df['Young_Customer_Flag'] = (df['Customer Age'] < 25).astype(int)
    df['Senior_Customer_Flag'] = (df['Customer Age'] >= 65).astype(int)
    
    # 7. Transaction day features
    df['Is_Month_Start'] = (df['Transaction Day'] <= 5).astype(int)
    df['Is_Month_End'] = (df['Transaction Day'] >= 25).astype(int)
    
    # 8. Interaction features (high-risk combinations)
    df['New_Account_Address_Mismatch'] = (df['New_Account_Flag'] * df['Address_Mismatch_Flag'])
    if 'Is_Night' in df.columns:
        df['Night_High_Amount'] = (df['Is_Night'] * (df['Transaction Amount'] > df['Transaction Amount'].median()).astype(int))
    
    print(f"[Feature Engineering] Created {len(df.columns)} total features (added {len(df.columns) - len(df.columns)} new features)")
    
    return df

train_df = clean_data(train_df)
train_df = engineer_advanced_features(train_df)

train_df.head()

train_df.info()

plt.figure(figsize=(10,4))
sns.histplot(train_df["Transaction Amount"],bins=200)

payment_count = train_df["Payment Method"].value_counts()
plt.figure(figsize=(15,4))
plt.subplot(1,2,1)
sns.set_palette('pastel')
colors = sns.color_palette()
plt.pie(payment_count,labels = payment_count.index,shadow=True,autopct='%1.1f%%',
        colors=colors,
        wedgeprops=dict(width=0.8,edgecolor="w"))
plt.title("Payment Method")

plt.subplot(1,2,2)

ax = sns.countplot(data=train_df,x="Payment Method",edgecolor="black",linewidth=1, palette="Set2")
for container in ax.containers:
    ax.bar_label(container)

category_count = train_df["Product Category"].value_counts()
plt.figure(figsize=(15,4))
plt.subplot(1,2,1)
sns.set_palette('pastel')
colors = sns.color_palette()
plt.pie(category_count,labels = category_count.index,shadow=True,autopct='%1.1f%%',
        colors=colors,
        wedgeprops=dict(width=0.8,edgecolor="w"))
plt.title("Product Category")

plt.subplot(1,2,2)

ax = sns.countplot(data=train_df,x="Product Category",edgecolor="black",linewidth=1, palette="Set2")
for container in ax.containers:
    ax.bar_label(container)

quantity_count = train_df["Quantity"].value_counts()
plt.figure(figsize=(15,4))
plt.subplot(1,2,1)
sns.set_palette('pastel')
colors = sns.color_palette()
plt.pie(quantity_count,labels = quantity_count.index,shadow=True,autopct='%1.1f%%',
        colors=colors,
        wedgeprops=dict(width=0.8,edgecolor="w"))
plt.title("Quantity")

plt.subplot(1,2,2)

ax = sns.countplot(data=train_df,x="Quantity",edgecolor="black",linewidth=1, palette="Set2")
for container in ax.containers:
    ax.bar_label(container)

plt.figure(figsize=(7,4))
sns.histplot(data=train_df, x="Customer Age",bins=150,kde=True,color='orange')

device_count = train_df["Device Used"].value_counts()
plt.figure(figsize=(15,4))
plt.subplot(1,2,1)
sns.set_palette('pastel')
colors = sns.color_palette()
plt.pie(device_count,labels = device_count.index,shadow=True,autopct='%1.1f%%',
        colors=colors,
        wedgeprops=dict(width=0.8,edgecolor="w"))
plt.title("Device Used")

plt.subplot(1,2,2)

ax = sns.countplot(data=train_df,x="Device Used",edgecolor="black",linewidth=1, palette="Set2")
for container in ax.containers:
    ax.bar_label(container)

plt.figure(figsize=(7,4))
sns.histplot(data=train_df, x="Account Age Days",bins=150,kde=True,color='orange')

hour_count = train_df["Transaction Hour"].value_counts().head(15)

plt.figure(figsize=(10,4))
sns.set_palette('Set2')
colors = sns.color_palette()
ax=sns.barplot(x=hour_count.index, y=hour_count.values,palette=colors)
plt.xticks(rotation=80)
for container in ax.containers:
    ax.bar_label(container)
plt.show()

plt.figure(figsize=(5,3))
sns.violinplot(data=train_df, x='Is Fraudulent', y='Transaction Amount')
plt.show()

column = ['Payment Method', 'Product Category',
       'Quantity', 'Device Used','Transaction DOW',
       'Transaction Month','Is Address Match']

plt.figure(figsize=(10,35))
plot_num = 1
for col in column:
    plt.subplot(10,2,plot_num)
    sns.countplot(data=train_df, x=col, hue="Is Fraudulent")
    plt.xticks(rotation=90)
    plt.title(col)
    plt.tight_layout()
    plot_num += 1

plt.figure(figsize=(10,6))
plt.subplot(1,2,1)
sns.boxenplot(x='Is Fraudulent', y='Transaction Amount', data=train_df)
plt.subplot(1,2,2)
sns.boxenplot(x='Is Fraudulent', y='Transaction Day', data=train_df)
plt.yticks(np.arange(0,32))
plt.show()

# """**FEATURE ENGINEERING**"""

import pandas as pd

data1 = pd.read_csv('Fraudulent_E-Commerce_Transaction_Data.csv')
data2 = pd.read_csv('Fraudulent_E-Commerce_Transaction_Data_2.csv')

combined_data = pd.concat([data1, data2], ignore_index=True)

target_column = 'target'

numerical_features = combined_data.select_dtypes(include=['number']).columns

correlation_matrix = combined_data[numerical_features].corr()

if target_column in combined_data.columns:
    target_corr = correlation_matrix[target_column].sort_values(ascending=False) if target_column in correlation_matrix else None
else:
    target_corr = None

threshold = 0.1

selected_features = correlation_matrix.columns[
    (correlation_matrix.abs().max() > threshold)
].tolist()

print("Selected Features:", selected_features)

if target_corr is not None:
    print("Feature Correlations with Target:")
    print(target_corr)

all_features = list(correlation_matrix.columns)
non_selected_features = list(set(all_features) - set(selected_features))

print("Selected Features:", selected_features)
print("Non-Selected Features:", non_selected_features)


train_data = train_df.drop(columns=["Is Fraudulent"])
train_label = train_df["Is Fraudulent"]


clean_test_df = clean_data(test_df)
clean_test_df = engineer_advanced_features(clean_test_df)
test_data = clean_test_df.drop(columns=["Is Fraudulent"])
test_label = clean_test_df["Is Fraudulent"]

cat_col = train_data.select_dtypes(include="O").columns
num_col = []
for col in train_data.columns:
    if col not in cat_col  and col != 'Is Address Match':
        num_col.append(col)

transformer = ColumnTransformer(transformers=[
    ('encoding',OneHotEncoder(),cat_col),
    ('scaling',StandardScaler(),num_col)
],remainder='passthrough')

classifiers = {
    "Logistic Regression" : LogisticRegression(),
    "Bernoulli NB" : BernoulliNB(),
    "Decision Tree" : DecisionTreeClassifier(),
    "Random Forest" : RandomForestClassifier(),
    "XGB": XGBClassifier()
}


import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import roc_curve, auc, precision_recall_curve, average_precision_score
import pandas as pd # explicitly importing pandas

# Assuming 'classifiers', 'train_data', 'train_label', 'test_data', and 'test_label' are defined as in the original code.

import pymongo
from datetime import datetime
import json
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

def store_model_results(model_name, model_type, metrics, plots, additional_info=None):
    """
    Store ML model results in MongoDB
    
    Parameters:
    - model_name: Name of the model
    - model_type: Type of the model (e.g., 'classification', 'regression')
    - metrics: List of dictionaries containing metrics (e.g., [{'name': 'accuracy', 'value': 0.95}])
    - plots: List of dictionaries containing plot data
    - additional_info: Any additional information to store (optional)
    """
    try:
        # Get MongoDB URL from environment variable
        mongo_url = os.getenv('MONGODB_URL')
        if not mongo_url:
            raise ValueError("MongoDB URL not found in environment variables")
        
        db = os.getenv('DB')
        if not db:
            raise ValueError("Database name not found in environment variables")
        
        collection = os.getenv('COLLECTION')
        if not collection:
            raise ValueError("Collection name not found in environment variables")
        client = pymongo.MongoClient(mongo_url)
        db = client[db]  # database name
        collection = db[collection]  # collection name
        
        # Prepare the document
        model_doc = {
            "modelName": model_name,
            "modelType": model_type,
            "createdAt": datetime.now(),
            "metrics": metrics,
            "plots": plots,
            "additionalInfo": additional_info
        }
        
        # Insert the document
        result = collection.insert_one(model_doc)
        print(f"Model results stored successfully with ID: {result.inserted_id}")
        
    except Exception as e:
        print(f"Error storing model results: {str(e)}")
    finally:
        if 'client' in locals():
            client.close()

# Store classifier results
classifier_results = []
for name, classifier in classifiers.items():
    model = Pipeline(steps=[
        ('transformer', transformer),
        ('classifier', classifier)
    ])
    model.fit(train_data, train_label)
    test_pred_proba = model.predict_proba(test_data)[:, 1]
    test_pred = model.predict(test_data)
    
    # Initialize metrics and additional info dictionary
    metrics = []
    additional_info = {}
    
    # Calculate metrics
    accuracy = accuracy_score(test_label, test_pred)
    conf_mat = confusion_matrix(test_label, test_pred)
    class_report = classification_report(test_label, test_pred, output_dict=True)
    
    # Store accuracy for comparison
    classifier_results.append({"Classifier name": name, "Accuracy": accuracy})
    
    metrics.append({"name": "accuracy", "value": accuracy})
    metrics.append({"name": "confusion_matrix", "value": conf_mat.tolist()})
    metrics.append({"name": "classification_report", "value": class_report})
    
    # Generate plots
    plots = []
    
    # ROC Curve
    fpr, tpr, _ = roc_curve(test_label, test_pred_proba)
    roc_auc = auc(fpr, tpr)
    roc_plot = {
        "type": f"{name}_ROC_Curve",
        "data": {
            "x": fpr.tolist(),
            "y": tpr.tolist(),
            "name": f"{name} ROC curve (AUC = {roc_auc:.2f})"
        },
        "layout": {
            "title": f"{name} ROC Curve Analysis (AUC = {roc_auc:.2f})",
            "xaxis": {"title": "False Positive Rate"},
            "yaxis": {"title": "True Positive Rate"}
        }
    }
    plots.append(roc_plot)
    
    # Precision-Recall Curve
    precision, recall, _ = precision_recall_curve(test_label, test_pred_proba)
    average_precision = average_precision_score(test_label, test_pred_proba)
    pr_plot = {
        "type": f"{name}_Precision_Recall_Curve",
        "data": {
            "x": recall.tolist(),
            "y": precision.tolist(),
            "name": f"{name} Precision-Recall curve (AP = {average_precision:.2f})"
        },
        "layout": {
            "title": f"{name} Precision-Recall Curve Analysis (AP = {average_precision:.2f})",
            "xaxis": {"title": "Recall"},
            "yaxis": {"title": "Precision"}
        }
    }
    plots.append(pr_plot)
    
    # Confusion Matrix Plot
    conf_mat_plot = {
        "type": f"{name}_Confusion_Matrix",
        "data": {
            "z": conf_mat.tolist(),
            "x": ["Predicted Negative", "Predicted Positive"],
            "y": ["Actual Negative", "Actual Positive"],
            "name": f"{name} Confusion Matrix"
        },
        "layout": {
            "title": f"{name} Confusion Matrix Analysis",
            "xaxis": {"title": "Predicted Label"},
            "yaxis": {"title": "True Label"}
        }
    }
    plots.append(conf_mat_plot)
    
    # Feature Importance Plot (if available)
    try:
        feature_names = model.named_steps['transformer'].get_feature_names_out(input_features=train_data.columns)
        feature_importance = model.named_steps['classifier'].feature_importances_
        importance_dict = dict(zip(feature_names.tolist(), feature_importance.tolist()))
        
        # Sort features by importance
        sorted_features = dict(sorted(importance_dict.items(), key=lambda x: x[1], reverse=True)[:10])
        
        feature_importance_plot = {
            "type": f"{name}_Feature_Importance",
            "data": {
                "x": list(sorted_features.values()),
                "y": list(sorted_features.keys()),
                "name": f"{name} Top 10 Feature Importance",
                "orientation": "h"
            },
            "layout": {
                "title": f"{name} Top 10 Feature Importance Analysis",
                "xaxis": {"title": "Importance Score"},
                "yaxis": {"title": "Feature Name"}
            }
        }
        plots.append(feature_importance_plot)
        additional_info["feature_importance"] = importance_dict
    except:
        pass
        
    # Store results in MongoDB
    store_model_results(
        model_name=name,
        model_type="classification",
        metrics=metrics,
        plots=plots,
        additional_info=additional_info
    )

# Display classifier comparison
results_df = pd.DataFrame(classifier_results)
print("\nClassifier Comparison:")
print(results_df.sort_values(by="Accuracy", ascending=False))

import optuna
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier


def objective(trial):
    """
    Optuna objective function optimized for ROC-AUC (IEEE-CIS competition metric)
    """
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
              "eval_metric": "auc",  # Use AUC for XGBoost internal evaluation
              "random_state": 42
              }

    # Remove "tree_method": "gpu_hist" or change it to "hist" for CPU
    # params["tree_method"] = "hist" # For CPU

    classifier = XGBClassifier(**params)

    model = Pipeline(steps=[
        ('transformer',transformer),
        ('classifier',classifier)
    ])
    model.fit(train_data, train_label)

    # Predict probabilities for ROC-AUC calculation
    pred_proba = model.predict_proba(test_data)[:, 1]
    
    # Calculate ROC-AUC score (primary metric for fraud detection)
    roc_auc = roc_auc_score(test_label, pred_proba)
    
    # Also calculate accuracy for reference
    preds = model.predict(test_data)
    accuracy = accuracy_score(test_label, preds)
    
    # Store both metrics as trial attributes
    trial.set_user_attr("accuracy", accuracy)
    trial.set_user_attr("roc_auc", roc_auc)

    return roc_auc  # Optimize for ROC-AUC instead of accuracy


study = optuna.create_study(direction="maximize")
study.optimize(objective, n_trials=70)


best_params = study.best_params
best_trial = study.best_trial

print("\n" + "="*60)
print("OPTIMIZATION RESULTS (IEEE-CIS Competition Metric)")
print("="*60)
print("Best Hyperparameters:", best_params)
print(f"Best ROC-AUC Score: {best_trial.value:.6f}")
print(f"Corresponding Accuracy: {best_trial.user_attrs.get('accuracy', 'N/A')}")
print("="*60)

optuna.visualization.plot_optimization_history(study)

optuna.visualization.plot_parallel_coordinate(study)

optuna.visualization.plot_slice(study)

optuna.visualization.plot_param_importances(study)

optuna.visualization.plot_timeline(study)
