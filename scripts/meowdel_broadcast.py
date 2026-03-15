import argparse
import requests
import sys

def send_discord(webhook_url, message):
    payload = {"content": message}
    try:
        response = requests.post(webhook_url, json=payload, timeout=10)
        if response.status_code not in [200, 204]:
            print(f"Error sending to Discord: {response.text}")
            sys.exit(1)
        print("Successfully sent to Discord.")
    except Exception as e:
        print(f"Exception sending to Discord: {e}")
        sys.exit(1)

def send_slack(webhook_url, message):
    payload = {"text": message}
    try:
        response = requests.post(webhook_url, json=payload, timeout=10)
        if response.status_code != 200:
            print(f"Error sending to Slack: {response.text}")
            sys.exit(1)
        print("Successfully sent to Slack.")
    except Exception as e:
        print(f"Exception sending to Slack: {e}")
        sys.exit(1)

def send_signal(api_url, number, message):
    # Assumes a standard signal-cli-rest-api daemon (e.g., bbernhard/signal-cli-rest-api)
    # Endpoint usually: POST /v2/send
    payload = {
        "message": message,
        "number": "+1234567890", # Replace with sender number if the API requires it
        "recipients": [number]
    }
    try:
        response = requests.post(f"{api_url.rstrip('/')}/v2/send", json=payload, timeout=10)
        if response.status_code not in [200, 201]:
            print(f"Error sending to Signal: {response.text}")
            sys.exit(1)
        print("Successfully sent to Signal.")
    except Exception as e:
        print(f"Exception sending to Signal: {e}")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Meowdel Broadcast Pipeline")
    parser.add_argument("--platform", choices=["discord", "slack", "signal"], required=True, help="The target platform to broadcast to")
    parser.add_argument("--destination", required=True, help="Webhook URL for Discord/Slack, or the base API URL for the Signal REST API")
    parser.add_argument("--message", required=True, help="The message text to broadcast")
    parser.add_argument("--signal-number", help="Required if platform is signal. The recipient phone number (e.g. +1234567890)")

    args = parser.parse_args()

    if args.platform == "discord":
        send_discord(args.destination, args.message)
    elif args.platform == "slack":
        send_slack(args.destination, args.message)
    elif args.platform == "signal":
        if not args.signal_number:
            print("Error: --signal-number is required when platform is signal.")
            sys.exit(1)
        send_signal(args.destination, args.signal_number, args.message)

if __name__ == "__main__":
    main()
