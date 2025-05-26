"""
I like my logs on slack, it's just helpful to see while I am away from workstation.
Maybe it is worth my time to make this a private package once I have bandwidth
"""
from slack import WebClient
import os


def debug_print(message, level="INFO"):
    """
    Prints debug information to the console.
    """
    formatted_message = f"[{level}] {message}"
    print(formatted_message)


class Logger:
    def __init__(self):
        self.slack_client = WebClient(os.environ["SLACK_BOT_TOKEN"])

    def notify_slack(self, message, level="INFO"):
        """
        Sends a message to Slack with a specific severity level.
        """
        if os.environ["ENV"] == "STAGING":
            # I do not need messages while developing
            return
        try:
            formatted_message = f"[{level}] {message}"
            debug_print(f"Sending Slack Message: {formatted_message}")
            self.slack_client.chat_postMessage(
                channel='monitor-cloud',
                text=formatted_message
            )
        except Exception as e:
            debug_print(f"Failed to send slack message: {e}")

    def info(self, message):
        """
        Logs an informational message.
        """
        debug_print(message)
        self.notify_slack(message, level="INFO")

    def warning(self, message):
        """
        Logs a warning message.
        """
        debug_print(message)
        self.notify_slack(message, level="WARNING")

    def severe(self, message):
        """
        Logs a severe (critical) message.
        """
        debug_print(message)
        self.notify_slack(message, level="SEVERE")



dbg = Logger()
