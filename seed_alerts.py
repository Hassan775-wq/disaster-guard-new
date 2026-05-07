import json
import random
from datetime import datetime, timezone, timedelta
from faker import Faker
import argparse
import os

try:
	import firebase_admin
	from firebase_admin import credentials, firestore
except Exception:
	firebase_admin = None



def generate_alerts(count=60):
	fake = Faker('en_PK')

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

	KARACHI_AREAS = [
		"Clifton, Karachi", "Defence, Karachi", "Gulshan-e-Iqbal, Karachi",
		"Korangi, Karachi", "Malir, Karachi", "Lyari, Karachi",
		"North Karachi, Karachi", "South District, Karachi", "East District, Karachi",
		"Bin Qasim, Karachi", "Jamshed Town, Karachi", "Orangi Town, Karachi",
		"Gadap Town, Karachi", "New Karachi, Karachi", "Baldia Town, Karachi"
	]

	alerts = []

	for i in range(1, count + 1):
		# Create an ISO 8601 UTC timestamp (some alerts in near future)
		future_minutes = random.randint(-60 * 24 * 7, 60 * 24 * 7)  # within +/- 7 days
		ts = (datetime.now(timezone.utc) + timedelta(minutes=future_minutes)).isoformat()

		alert = {
			"id": f"alert_{i:03d}",
			"title": random.choice(ALERT_TITLES),
			"description": fake.sentence(nb_words=12) if random.random() < 0.3 else random.choice(DESCRIPTIONS),
			"predictedTime": random.choice(PREDICTED_TIMES),
			"severity": random.choice(SEVERITIES),
			"confidence": int(random.randint(60, 100)),
			"location": random.choice(KARACHI_AREAS),
			"timestamp": ts
		}

		alerts.append(alert)

	return alerts


def main():
	parser = argparse.ArgumentParser(description="Generate and upload disaster alerts to Firestore")
	parser.add_argument("--creds", help="Path to service account JSON file", default="serviceAccountKey.json")
	parser.add_argument("--count", help="Number of alerts to generate", type=int, default=60)
	parser.add_argument("--no-upload", help="Only write local JSON and skip Firestore upload", action="store_true")
	args = parser.parse_args()

	alerts = generate_alerts(args.count)

	# Write local JSON (convert timestamps to ISO strings for JSON)
	out_file = "disaster_alerts.json"
	serializable = []
	for a in alerts:
		item = dict(a)
		if isinstance(item.get("timestamp"), datetime):
			item["timestamp"] = item["timestamp"].isoformat()
		serializable.append(item)

	with open(out_file, "w", encoding="utf-8") as f:
		json.dump({"alerts": serializable}, f, indent=2, ensure_ascii=False)

	print(f"Generated {len(alerts)} alerts and wrote to '{out_file}'")

	if args.no_upload:
		print("Skipping Firestore upload (--no-upload).")
		return

	if firebase_admin is None:
		print("firebase-admin is not installed. Install with: python -m pip install firebase-admin")
		return

	creds_path = args.creds
	if not os.path.exists(creds_path):
		print(f"Service account file not found: {creds_path}")
		print("Place your service account JSON at that path or pass --creds /path/to/key.json")
		return

	cred = credentials.Certificate(creds_path)
	try:
		if not firebase_admin._apps:
			firebase_admin.initialize_app(cred)
	except Exception:
		# already initialized or other issue; attempt to continue
		pass

	db = firestore.client()

	# Upload each alert as a document with the alert id as the document name
	col = db.collection("alerts")
	for a in alerts:
		doc_id = a["id"]
		# Firestore accepts python datetimes for timestamp fields
		col.document(doc_id).set(a)

	print(f"Uploaded {len(alerts)} alerts to Firestore collection 'alerts'.")


if __name__ == "__main__":
	main()

