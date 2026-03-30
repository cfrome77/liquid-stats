import requests
import re
import os

css_urls = {
    "Montserrat": "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap",
    "Nunito": "https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&display=swap",
    "Roboto": "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap",
    "Material Icons": "https://fonts.googleapis.com/icon?family=Material+Icons&display=swap"
}

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

os.makedirs("src/assets/fonts", exist_ok=True)
all_css_content = ""

for family, url in css_urls.items():
    response = requests.get(url, headers=headers)
    css_content = response.text

    # Find all font URLs
    font_urls = re.findall(r'url\((https://fonts.gstatic.com/s/[^)]+)\)', css_content)

    for font_url in font_urls:
        filename = os.path.basename(font_url)
        filepath = os.path.join("src/assets/fonts", filename)

        if not os.path.exists(filepath):
            print(f"Downloading {filename}...")
            font_response = requests.get(font_url)
            with open(filepath, "wb") as f:
                f.write(font_response.content)

        # Replace URL in CSS
        css_content = css_content.replace(font_url, f"./{filename}")

    all_css_content += css_content + "\n"

with open("src/assets/fonts/fonts.css", "w") as f:
    f.write(all_css_content)

print("Done!")
