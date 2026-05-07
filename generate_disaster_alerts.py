import json
import random
from datetime import datetime, timedelta
from faker import Faker

# Initialize Faker instance with en_PK locale for Pakistani data
fake = Faker('en_PK')

# Define alert types and related data
ALERT_TITLES = [
    "Heat Wave", "Flood", "Earthquake", "Landslide", "Tornado",
    "Hurricane", "Wildfires", "Thunderstorm", "Heavy Rainfall",
    "Drought", "Flash Flood", "Avalanche", "Tsunami", "Blizzard",
    "Hailstorm", "Dust Storm", "Cyclone", "Volcanic Eruption"
]

DESCRIPTIONS = [
    "Extreme temperature conditions expected in the region.",
    "Heavy water accumulation posing risk to low-lying areas.",
    "Significant ground movement detected in the area.",
    "Risk of soil displacement on steep terrain.",
    "Rotating column of air with destructive winds.",
    "Severe storm system approaching with high wind speeds.",
    "Uncontrolled fire spreading through vegetation.",
    "Severe electrical storm with lightning and rain.",
    "Intense rainfall expected to cause flooding.",
    "Prolonged lack of precipitation causing water scarcity.",
    "Sudden and rapid water overflow in rivers.",
    "Rapid snow or ice mass movement down slopes.",
    "Large ocean waves caused by underwater disturbance.",
    "Heavy snow with strong winds and low visibility.",
    "Large ice and water precipitation.",
    "Strong winds carrying dust and sand.",
    "Rotating storm system over tropical waters.",
    "Molten rock and ash eruption from volcano."
]

PREDICTED_TIMES = [
    "In 1 hour", "In 2 hours", "In 4 hours", "In 6 hours",
    "In 12 hours", "In 24 hours", "In 2 days", "In 3 days",
    "Immediate", "Within minutes", "In 30 minutes"
]

SEVERITIES = ["Critical", "High", "Moderate", "Low"]

# Karachi locations for realistic positioning
KARACHI_AREAS = [
    "Clifton, Karachi", "Defence, Karachi", "Gulshan-e-Iqbal, Karachi",
    "Korangi, Karachi", "Malir, Karachi", "Lyari, Karachi",
    "North Karachi, Karachi", "South District, Karachi", "East District, Karachi",
    "Bin Qasim, Karachi", "Jamshed Town, Karachi", "Orangi Town, Karachi",
    "Gadap Town, Karachi", "New Karachi, Karachi", "Baldia Town, Karachi"
]

def generate_alerts(count=60):
    """Generate dummy disaster alerts"""
    alerts = []
    
    for i in range(1, count + 1):
        # Generate timestamp
        days_offset = random.randint(0, 30)
        hours_offset = random.randint(0, 23)
        timestamp = (datetime.utcnow() - timedelta(days=days_offset, hours=hours_offset)).isoformat() + 'Z'
        
        alert = {
            "id": f"alert_{i:03d}",
            "title": random.choice(ALERT_TITLES),
            "description": random.choice(DESCRIPTIONS),
            "predictedTime": random.choice(PREDICTED_TIMES),
            "severity": random.choice(SEVERITIES),
            "confidence": random.randint(60, 100),
            "location": random.choice(KARACHI_AREAS),
            "timestamp": timestamp
        }
        
        alerts.append(alert)
    
    return alerts

def main():
    """Main function to generate and save alerts"""
    print("Generating 60 dummy disaster alerts...")
    
    # Generate alerts
    alerts_list = generate_alerts(60)
    
    # Create parent JSON structure
    data = {
        "alerts": alerts_list
    }
    
    # Save to JSON file
    output_file = "disaster_alerts.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Successfully generated {len(alerts_list)} alerts")
    print(f"✓ Saved to '{output_file}'")
    print(f"\nSample alert:")
    print(json.dumps(alerts_list[0], indent=2))

if __name__ == "__main__":
    main()
