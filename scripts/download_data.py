import kagglehub
import shutil
import os

# Download latest version
dataset_path = kagglehub.dataset_download("zkskhurram/global-petrol-prices-impact-of-2026-us-iran-war")

destination = "data/raw"

os.makedirs(destination, exist_ok=True)

for file in os.listdir(dataset_path):
    shutil.copy(os.path.join(dataset_path, file), destination)

print("Path to dataset files:", dataset_path)