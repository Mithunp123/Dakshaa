
import os
import urllib.request

url = "https://www.drestein.in/models/robot_playground.glb"
output_dir = r"c:\Users\DeekshSachu\Desktop\DaKshaaWeb-main v2 (3)\DaKshaaWeb-main v2\DaKshaaWeb-main v2\Frontend\public\models"
output_file = os.path.join(output_dir, "robot_playground.glb")

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

print(f"Downloading {url} to {output_file}...")
try:
    urllib.request.urlretrieve(url, output_file)
    print("Download complete.")
except Exception as e:
    print(f"Error downloading: {e}")
