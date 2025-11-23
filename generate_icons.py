#!/usr/bin/env python3
"""
Generate simple VLC-style icons for the Chrome extension
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_vlc_icon(size, filename):
    """Create a simple VLC-style traffic cone icon"""
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Calculate proportions
    margin = size * 0.1
    cone_width = size * 0.6
    cone_height = size * 0.7
    base_height = size * 0.15
    
    # Cone position
    center_x = size / 2
    top_y = margin
    bottom_y = size - margin - base_height
    
    # Draw orange cone with stripes
    # Main cone body
    cone_points = [
        (center_x - cone_width/2, bottom_y),
        (center_x, top_y),
        (center_x + cone_width/2, bottom_y)
    ]
    draw.polygon(cone_points, fill='#FF8800')
    
    # White stripes
    stripe_height = cone_height / 5
    for i in range(1, 3):
        stripe_y = top_y + (i * stripe_height)
        stripe_width_ratio = 0.2 + (i * 0.15)
        stripe_width = cone_width * stripe_width_ratio
        
        left_x = center_x - stripe_width/2
        right_x = center_x + stripe_width/2
        
        draw.polygon([
            (left_x, stripe_y),
            (right_x, stripe_y),
            (right_x + cone_width*0.1, stripe_y + stripe_height*0.8),
            (left_x - cone_width*0.1, stripe_y + stripe_height*0.8)
        ], fill='#FFFFFF')
    
    # Draw base
    base_y = bottom_y
    base_width = cone_width * 1.2
    draw.ellipse([
        center_x - base_width/2, base_y,
        center_x + base_width/2, base_y + base_height
    ], fill='#333333')
    
    # Save
    img.save(filename, 'PNG')
    print(f"Created {filename}")

def main():
    # Create icons directory
    icons_dir = 'icons'
    os.makedirs(icons_dir, exist_ok=True)
    
    # Generate icons in different sizes
    create_vlc_icon(16, os.path.join(icons_dir, 'icon16.png'))
    create_vlc_icon(48, os.path.join(icons_dir, 'icon48.png'))
    create_vlc_icon(128, os.path.join(icons_dir, 'icon128.png'))
    
    print("\nAll icons created successfully!")
    print("You can now load the extension in Chrome.")

if __name__ == '__main__':
    try:
        main()
    except ImportError:
        print("Error: PIL (Pillow) is not installed.")
        print("Install it with: pip3 install Pillow")
        print("\nAlternatively, you can:")
        print("1. Create your own icons (16x16, 48x48, 128x128 PNG files)")
        print("2. Download VLC icons from the VLC project")
        print("3. Use any other icon creation tool")

