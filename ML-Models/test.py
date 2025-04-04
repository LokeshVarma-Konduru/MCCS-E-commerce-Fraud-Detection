import pandas as pd

# Read the CSV file
df = pd.read_csv('Fraudulent_E-Commerce_Transaction_Data.csv')

# Get distinct values from a specific column
column_name = 'Device Used'
unique_values = df[column_name].unique()

print(unique_values)