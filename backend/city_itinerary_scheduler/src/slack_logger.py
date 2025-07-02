from slack import WebClient
import os


class Logger:
    def __init__(self, app_name):
        self.app_name = app_name
        self.env = os.environ["ENV"]
        self.slack_client = WebClient(os.environ["SLACK_BOT_TOKEN"])

    def notify_slack(self, message, level="INFO"):
        """
        Sends a message to Slack with a specific severity level.
        """
        if self.env == "STAGING":
            # I do not need slack messages while developing
            self.debug_print(f"Sending Slack Message: {formatted_message}")
            return
        try:
            formatted_message = f"[{self.app_name}]:[{self.env}] [{level}] {message}"
            self.slack_client.chat_postMessage(
                channel='monitor-cloud',
                text=formatted_message
            )
        except Exception as e:
            self.debug_print(f"Failed to send slack message: {e}")

    def info(self, message):
        """
        Logs an informational message.
        """
        self.debug_print(message, level="INFO")
        self.notify_slack(message, level="INFO")

    def warning(self, message):
        """
        Logs a warning message.
        """
        self.debug_print(message, level="WARNING")
        self.notify_slack(message, level="WARNING")

    def severe(self, message):
        """
        Logs a severe (critical) message.
        """
        self.debug_print(message, level="SEVERE")
        self.notify_slack(message, level="SEVERE")

    def debug_print(self, message, level="INFO"):
        """
        Prints debug information to the console.
        """
        formatted_message = f"[{self.app_name}]:[{self.env}] [{level}] {message}"
        print(formatted_message)

dbg = Logger("CITY_ITINERARY_SCHEDULER")
