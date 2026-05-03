import os
import shutil
import glob

# Source artifacts directory
artifacts_dir = "/home/ibadat/.gemini/antigravity/brain/06201852-14c3-4874-862d-7d197290919a/"

# Destination test_images directory (with spaces handled automatically by Python)
dest_dir = "/media/ibadat/NewVolume/DATA SCIENCE/ML/DATASCIENCE PROJECTS/carevision_project/test_images"

# Map prefixes to clean filenames
image_types = {
    "test_strip_": "test_strip.png",
    "med_scan_": "med_scan.png",
    "wound_assess_": "wound_assess.png",
    "doc_reader_": "doc_reader.png"
}

os.makedirs(dest_dir, exist_ok=True)
print(f"Copying newly generated test images to: {dest_dir}")

files = glob.glob(os.path.join(artifacts_dir, "*.png"))

copied = 0
for file_path in files:
    filename = os.path.basename(file_path)
    for prefix, target_name in image_types.items():
        if filename.startswith(prefix):
            target_path = os.path.join(dest_dir, target_name)
            shutil.copy2(file_path, target_path)
            print(f"Copied {filename} -> {target_name}")
            copied += 1
            break

print(f"\nSuccessfully copied {copied} images to {dest_dir}")
print("You can now use these images to evaluate the CareVision functionalities.")
