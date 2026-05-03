import requests
import base64

# Dummy image: 1x1 transparent PNG
image_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
b64_image = base64.b64encode(image_data).decode('utf-8')

for endpoint in ['medscan', 'woundassess', 'docreader', 'teststrip']:
    url = f"http://127.0.0.1:8000/analyze/{endpoint}"
    payload = {
        "image_b64": b64_image,
        "language": "en"
    }
    try:
        response = requests.post(url, json=payload, timeout=30)
        print(f"[{endpoint}] Status: {response.status_code}")
        if response.status_code != 200:
            print(f"[{endpoint}] Error: {response.text}")
    except Exception as e:
        print(f"[{endpoint}] Exception: {e}")
