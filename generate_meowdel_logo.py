#!/usr/bin/env python3
import os
import json
import time
import urllib.request
import urllib.parse

FAL_KEY = os.environ.get('FAL_KEY')
if not FAL_KEY:
    print("Error: FAL_KEY environment variable not set")
    exit(1)

# Meowdel logo concepts
prompts = [
    {
        "name": "meowdel_on_keyboard",
        "prompt": "A cute Russian Blue Maine Coon cat mascot sitting on a laptop keyboard, tech startup logo style, clean vector art, professional branding, blue-grey fur, friendly expression, modern minimal design, white background"
    },
    {
        "name": "meowdel_network_cables",
        "prompt": "A playful Russian Blue Maine Coon cat mascot pulling colorful network cables out of a server rack, tech startup logo style, clean vector art, professional branding, blue-grey fur, mischievous expression, modern minimal design, white background"
    },
    {
        "name": "meowdel_being_petted",
        "prompt": "A content Russian Blue Maine Coon cat mascot being petted by a hand wearing a smartwatch, tech startup logo style, clean vector art, professional branding, blue-grey fur, happy purring expression, modern minimal design, white background"
    },
    {
        "name": "meowdel_catnip",
        "prompt": "A curious Russian Blue Maine Coon cat mascot sniffing catnip leaves, tech startup logo style, clean vector art, professional branding, blue-grey fur, focused expression, modern minimal design, white background"
    }
]

def generate_image(prompt_data):
    print(f"\nGenerating: {prompt_data['name']}...")

    # Submit the request using the run endpoint instead of queue
    data = json.dumps({
        "prompt": prompt_data['prompt'],
        "image_size": "square_hd",
        "num_inference_steps": 28,
        "guidance_scale": 3.5,
        "num_images": 1
    }).encode('utf-8')

    req = urllib.request.Request(
        "https://fal.run/fal-ai/flux/dev",
        data=data,
        headers={
            "Authorization": f"Key {FAL_KEY}",
            "Content-Type": "application/json"
        },
        method='POST'
    )

    try:
        print(f"  Sending request to fal.ai...")
        with urllib.request.urlopen(req, timeout=120) as response:
            result = json.loads(response.read().decode('utf-8'))

        print(f"  ✓ Generation completed")

        images = result.get('images', [])
        if images:
            image_url = images[0].get('url')
            print(f"  ✓ Image URL: {image_url}")

            # Download the image
            try:
                with urllib.request.urlopen(image_url) as img_response:
                    img_data = img_response.read()
                    filename = f"{prompt_data['name']}.png"
                    with open(filename, 'wb') as f:
                        f.write(img_data)
                    print(f"  ✓ Saved: {filename}")
                    return filename
            except Exception as e:
                print(f"  ✗ Error downloading image: {e}")
        else:
            print(f"  ✗ No images in response")

    except urllib.error.HTTPError as e:
        print(f"  ✗ HTTP Error: {e.code} - {e.reason}")
        print(f"  Response: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"  ✗ Error: {e}")

    return None

# Generate all logo concepts
print("🐱 Generating Meowdel mascot logo concepts...")
generated_files = []

for prompt_data in prompts:
    filename = generate_image(prompt_data)
    if filename:
        generated_files.append(filename)
    time.sleep(1)  # Small delay between requests

print(f"\n✨ Done! Generated {len(generated_files)} logo concepts:")
for f in generated_files:
    print(f"  - {f}")
