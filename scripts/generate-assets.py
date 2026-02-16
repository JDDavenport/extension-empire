#!/usr/bin/env python3
"""Generate store icons (128x128) and screenshots (1280x800) for all extensions."""
from PIL import Image, ImageDraw, ImageFont
import os

EXTENSIONS = {
    "email-finder-pro": {
        "name": "Email Finder Pro",
        "short": "EF",
        "color": (41, 128, 185),
        "icon_emoji": "📧",
        "tagline": "Find emails from LinkedIn profiles instantly",
        "features": ["Extract emails from LinkedIn", "Bulk export contacts", "Verify email accuracy", "CRM integration ready"],
    },
    "tab-master-pro": {
        "name": "Tab Master Pro", 
        "short": "TM",
        "color": (142, 68, 173),
        "icon_emoji": "📑",
        "tagline": "Save sessions, manage tabs, boost productivity",
        "features": ["Save & restore sessions", "Search across all tabs", "Suspend inactive tabs", "Detect duplicates"],
    },
    "etsy-seller-tools": {
        "name": "Etsy Seller Tools",
        "short": "ET",
        "color": (230, 126, 34),
        "icon_emoji": "🏪",
        "tagline": "SEO, competitor spy & analytics for Etsy sellers",
        "features": ["SEO tag optimizer", "Competitor price tracking", "Sales analytics dashboard", "Listing quality score"],
    },
    "ai-chat-manager": {
        "name": "AI Chat Manager",
        "short": "AI",
        "color": (26, 188, 156),
        "icon_emoji": "🤖",
        "tagline": "Organize your ChatGPT & Claude conversations",
        "features": ["Folder organization", "Search all chats", "Export conversations", "Tag & categorize"],
    },
    "amazon-seller-dash": {
        "name": "Amazon Seller Dash",
        "short": "AS",
        "color": (255, 153, 0),
        "icon_emoji": "📦",
        "tagline": "Profit calculator & analytics for Amazon sellers",
        "features": ["Real-time profit tracking", "Fee calculator", "Sales trends & charts", "Inventory alerts"],
    },
    "yt-analytics-pro": {
        "name": "YT Analytics Pro",
        "short": "YT",
        "color": (255, 0, 0),
        "icon_emoji": "▶️",
        "tagline": "YouTube creator analytics & growth toolkit",
        "features": ["Real-time view tracking", "Revenue estimator", "Competitor analysis", "Upload scheduler"],
    },
    "fb-marketplace-pro": {
        "name": "FB Marketplace Pro",
        "short": "FB",
        "color": (59, 89, 152),
        "icon_emoji": "🏷️",
        "tagline": "Auto-relist, bulk post & track FB Marketplace sales",
        "features": ["One-click relist", "Bulk listing creator", "Sales tracker", "Message templates"],
    },
    "shopify-power-tools": {
        "name": "Shopify Power Tools",
        "short": "SP",
        "color": (150, 191, 72),
        "icon_emoji": "🛒",
        "tagline": "Quick edit, bulk actions & analytics for Shopify",
        "features": ["Bulk price editor", "Quick product edit", "Order analytics", "SEO optimizer"],
    },
}

BASE = os.path.expanduser("~/clawd/projects/extension-empire/extensions")

def make_icon(ext_dir, name, short, color):
    """Create a 128x128 icon with initials on colored background."""
    img = Image.new("RGB", (128, 128), color)
    draw = ImageDraw.Draw(img)
    # Draw rounded rectangle effect with lighter center
    for i in range(10):
        c = tuple(min(255, v + i * 3) for v in color)
        draw.rectangle([i, i, 127-i, 127-i], fill=c)
    # Draw initials
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 52)
    except:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), short, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (128 - tw) // 2
    y = (128 - th) // 2 - 5
    # Shadow
    draw.text((x+2, y+2), short, fill=(0, 0, 0, 128), font=font)
    draw.text((x, y), short, fill="white", font=font)
    
    path = os.path.join(ext_dir, "store", "icon128.png")
    img.save(path)
    print(f"  Icon: {path}")

def make_screenshot(ext_dir, name, tagline, features, color):
    """Create a 1280x800 screenshot with feature highlights."""
    img = Image.new("RGB", (1280, 800), (245, 245, 245))
    draw = ImageDraw.Draw(img)
    
    # Header bar
    draw.rectangle([0, 0, 1280, 120], fill=color)
    try:
        title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 42)
        tag_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24)
        feat_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 28)
        small_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
    except:
        title_font = tag_font = feat_font = small_font = ImageFont.load_default()
    
    # Title
    draw.text((40, 25), name, fill="white", font=title_font)
    draw.text((40, 78), tagline, fill=(255, 255, 255, 200), font=tag_font)
    
    # Feature cards
    card_y = 160
    for i, feat in enumerate(features):
        cy = card_y + i * 140
        # Card background
        draw.rounded_rectangle([60, cy, 620, cy + 120], radius=12, fill="white", outline=(220, 220, 220))
        # Checkmark
        draw.ellipse([85, cy + 35, 125, cy + 75], fill=color)
        draw.text((95, cy + 38), "✓", fill="white", font=feat_font)
        # Feature text
        draw.text((150, cy + 40), feat, fill=(50, 50, 50), font=feat_font)
    
    # Right side - mock UI panel
    draw.rounded_rectangle([680, 160, 1220, 720], radius=16, fill="white", outline=(200, 200, 200))
    draw.rectangle([680, 160, 1220, 220], fill=color)
    draw.text((710, 172), f"{name} Dashboard", fill="white", font=tag_font)
    
    # Mock stats
    stats = [("Active", "1,247"), ("Today", "+89"), ("Score", "94%")]
    for i, (label, val) in enumerate(stats):
        sx = 720 + i * 170
        draw.rounded_rectangle([sx, 245, sx + 150, 340], radius=8, fill=(248, 248, 248))
        draw.text((sx + 20, 255), label, fill=(130, 130, 130), font=small_font)
        draw.text((sx + 20, 285), val, fill=color, font=feat_font)
    
    # Mock chart area
    draw.rounded_rectangle([720, 370, 1180, 690], radius=8, fill=(248, 248, 248))
    draw.text((740, 385), "Performance Overview", fill=(80, 80, 80), font=tag_font)
    # Simple bar chart
    for i in range(8):
        bh = 30 + (i * 17) % 200
        bx = 760 + i * 50
        draw.rectangle([bx, 660 - bh, bx + 35, 660], fill=color)
    
    # CTA
    draw.rounded_rectangle([60, 730, 350, 780], radius=25, fill=color)
    draw.text((100, 738), "Install Free →", fill="white", font=tag_font)
    
    path = os.path.join(ext_dir, "store", "screenshot1.png")
    img.save(path, "PNG")
    print(f"  Screenshot: {path}")

for key, ext in EXTENSIONS.items():
    ext_dir = os.path.join(BASE, key)
    store_dir = os.path.join(ext_dir, "store")
    os.makedirs(store_dir, exist_ok=True)
    print(f"\n{ext['name']}:")
    make_icon(ext_dir, ext["name"], ext["short"], ext["color"])
    make_screenshot(ext_dir, ext["name"], ext["tagline"], ext["features"], ext["color"])

print("\n✅ All assets generated!")
